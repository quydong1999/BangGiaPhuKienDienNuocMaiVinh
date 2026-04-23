import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

/**
 * GET /api/sse/transactions
 * 
 * Server-Sent Events endpoint cho real-time transaction notifications.
 * Polling MongoDB mỗi 3 giây để phát hiện giao dịch mới.
 * 
 * Tại sao dùng polling thay vì EventEmitter?
 * → Trong Next.js, webhook POST route và SSE GET route có thể chạy ở
 *   context khác nhau (đặc biệt trong dev mode), nên EventEmitter trên
 *   `global` không được chia sẻ. Polling MongoDB là cách đáng tin cậy nhất.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return new Response('Unauthorized', { status: 403 });
  }

  await connectDB();

  // Lấy timestamp hiện tại làm mốc — chỉ gửi event cho giao dịch SAU thời điểm kết nối
  let lastCheckedAt = new Date();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Gửi event kết nối thành công
      controller.enqueue(
        encoder.encode('event: connected\ndata: {"status":"ok"}\n\n')
      );

      // Heartbeat mỗi 30 giây
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, 30000);

      // Poll MongoDB mỗi 3 giây để tìm giao dịch mới
      const poller = setInterval(async () => {
        try {
          const newTransactions = await Transaction.find({
            createdAt: { $gt: lastCheckedAt },
          })
            .sort({ createdAt: 1 })
            .lean();

          if (newTransactions.length > 0) {
            // Cập nhật mốc thời gian
            lastCheckedAt = new Date();

            for (const tx of newTransactions) {
              const eventData = `event: new-transaction\ndata: ${JSON.stringify({
                _id: tx._id,
                gateway: tx.gateway,
                transactionDate: tx.transactionDate,
                accountNumber: tx.accountNumber,
                amountIn: tx.amountIn,
                amountOut: tx.amountOut,
                code: tx.code,
                transactionContent: tx.transactionContent,
                referenceNumber: tx.referenceNumber,
              })}\n\n`;

              controller.enqueue(encoder.encode(eventData));
            }
          }
        } catch (err) {
          console.error('SSE poll error:', err);
        }
      }, 3000);

      function cleanup() {
        clearInterval(heartbeat);
        clearInterval(poller);
      }

      // Cleanup khi client ngắt kết nối
      // Note: ReadableStream cancel() sẽ được gọi khi client disconnect
    },
    cancel() {
      // Client đã ngắt kết nối → dọn dẹp ở đây nếu cần
      // (intervals đã được clear trong cleanup hoặc sẽ tự dừng khi enqueue throw)
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// SSE phải là dynamic, không cache
export const dynamic = 'force-dynamic';

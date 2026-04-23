import { auth } from '@/auth';
import { transactionEmitter, TRANSACTION_EVENTS } from '@/lib/event-emitter';

/**
 * GET /api/sse/transactions
 * 
 * Server-Sent Events endpoint cho real-time transaction notifications.
 * Chỉ admin mới có thể kết nối.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return new Response('Unauthorized', { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Gửi heartbeat mỗi 30 giây để giữ kết nối
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Lắng nghe event từ SepayService
      const onNewTransaction = (data: unknown) => {
        try {
          const eventData = `event: new-transaction\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(eventData));
        } catch {
          // Client đã ngắt kết nối
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(heartbeat);
        transactionEmitter.off(TRANSACTION_EVENTS.NEW_TRANSACTION, onNewTransaction);
      };

      transactionEmitter.on(TRANSACTION_EVENTS.NEW_TRANSACTION, onNewTransaction);

      // Gửi event kết nối thành công
      controller.enqueue(
        new TextEncoder().encode('event: connected\ndata: {"status":"ok"}\n\n')
      );
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

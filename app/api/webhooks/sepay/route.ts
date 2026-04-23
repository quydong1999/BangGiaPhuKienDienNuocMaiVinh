import { NextResponse } from 'next/server';
import { sepayService } from '@/services/SepayService';

/**
 * POST /api/webhooks/sepay
 * 
 * Webhook endpoint nhận dữ liệu giao dịch từ SePay.
 * - Validate API Key (nếu có cấu hình)
 * - Gọi SepayService.processWebhookData()
 * - Luôn trả 200 OK cho SePay (kể cả khi xử lý thất bại nội bộ)
 */
export async function POST(req: Request) {
  try {
    // 1. Xác thực API Key (optional — nếu có cấu hình)
    const apiKey = process.env.SEPAY_WEBHOOK_API_KEY;
    if (apiKey) {
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Apikey ', '').replace('Bearer ', '');
      
      if (token !== apiKey) {
        console.warn('⚠️ SePay Webhook: Invalid API Key');
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // 2. Parse body
    const body = await req.json();
    console.log('📩 SePay Webhook received:', JSON.stringify(body));

    // 3. Gọi Service để xử lý
    const result = await sepayService.processWebhookData(body);

    // 4. Luôn trả 200 cho SePay
    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ SePay Webhook error:', message);

    // Vẫn trả 200 để SePay không retry liên tục
    return NextResponse.json({
      success: false,
      message: 'Internal error, but acknowledged',
    });
  }
}

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { sepayService } from '@/services/SepayService';

/**
 * GET /api/transactions
 * 
 * Lấy danh sách giao dịch (chỉ admin).
 * Query params: startDate, endDate, gateway, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      gateway: searchParams.get('gateway') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
    };

    const result = await sepayService.findAll(query);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get transactions error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

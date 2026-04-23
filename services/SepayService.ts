import { connectDB } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { transactionEmitter, TRANSACTION_EVENTS } from '@/lib/event-emitter';

/**
 * SePay Webhook payload interface
 * Dựa trên tài liệu chính thức của SePay
 */
export interface ISepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string | null;
  subAccount: string | null;
  code: string | null;
  content: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  referenceCode: string | null;
  description?: string;
}

export interface ITransactionQuery {
  startDate?: string;
  endDate?: string;
  gateway?: string;
  page?: number;
  limit?: number;
}

export class SepayService {
  private static instance: SepayService;

  private constructor() {}

  public static getInstance(): SepayService {
    if (!SepayService.instance) {
      SepayService.instance = new SepayService();
    }
    return SepayService.instance;
  }

  /**
   * Xử lý dữ liệu webhook từ SePay
   * - Validate data
   * - Normalize & map fields
   * - Upsert vào DB (idempotent theo referenceCode)
   * - Emit real-time event
   */
  async processWebhookData(data: ISepayWebhookPayload): Promise<{
    success: boolean;
    isNew: boolean;
    message: string;
  }> {
    await connectDB();

    // 1. Validate required fields
    if (!data.gateway || !data.transferAmount || !data.transactionDate) {
      return {
        success: false,
        isNew: false,
        message: 'Missing required fields: gateway, transferAmount, transactionDate',
      };
    }

    // 2. Normalize data → map SePay payload sang Transaction schema
    const transactionData = {
      gateway: data.gateway,
      transactionDate: new Date(data.transactionDate),
      accountNumber: data.accountNumber || null,
      subAccount: data.subAccount || null,
      amountIn: data.transferType === 'in' ? data.transferAmount : 0,
      amountOut: data.transferType === 'out' ? data.transferAmount : 0,
      accumulated: 0,
      code: data.code || null,
      transactionContent: data.content || data.description || null,
      referenceNumber: data.referenceCode || `SEPAY-${data.id}`,
      body: JSON.stringify(data),
    };

    // 3. Upsert — dùng referenceNumber làm unique key để đảm bảo idempotency
    //    $setOnInsert: chỉ set khi INSERT, không update nếu đã tồn tại
    const result = await Transaction.findOneAndUpdate(
      { referenceNumber: transactionData.referenceNumber },
      { $setOnInsert: transactionData },
      { upsert: true, new: true, rawResult: true }
    );

    const isNew = result.lastErrorObject?.updatedExisting === false;

    // 4. Nếu là giao dịch mới → emit event cho SSE stream
    if (isNew && result.value) {
      const txData = result.value.toObject ? result.value.toObject() : result.value;
      transactionEmitter.emit(TRANSACTION_EVENTS.NEW_TRANSACTION, {
        _id: txData._id,
        gateway: txData.gateway,
        transactionDate: txData.transactionDate,
        accountNumber: txData.accountNumber,
        amountIn: txData.amountIn,
        amountOut: txData.amountOut,
        code: txData.code,
        transactionContent: txData.transactionContent,
        referenceNumber: txData.referenceNumber,
      });
    }

    return {
      success: true,
      isNew,
      message: isNew ? 'Transaction saved successfully' : 'Transaction already exists (duplicate)',
    };
  }

  /**
   * Lấy danh sách giao dịch, hỗ trợ filter theo ngày và phân trang
   */
  async findAll(query: ITransactionQuery = {}) {
    await connectDB();

    const filter: Record<string, unknown> = {};

    // Filter theo ngày
    if (query.startDate || query.endDate) {
      filter.transactionDate = {} as Record<string, Date>;
      if (query.startDate) {
        (filter.transactionDate as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        // Thêm 1 ngày để bao gồm cả ngày cuối
        const endDate = new Date(query.endDate);
        endDate.setDate(endDate.getDate() + 1);
        (filter.transactionDate as Record<string, Date>).$lt = endDate;
      }
    }

    // Filter theo gateway
    if (query.gateway) {
      filter.gateway = { $regex: query.gateway, $options: 'i' };
    }

    // Phân trang
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Thống kê tổng tiền vào/ra
   */
  async getStats() {
    await connectDB();

    const result = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalIn: { $sum: '$amountIn' },
          totalOut: { $sum: '$amountOut' },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0] || { totalIn: 0, totalOut: 0, count: 0 };
  }
}

export const sepayService = SepayService.getInstance();

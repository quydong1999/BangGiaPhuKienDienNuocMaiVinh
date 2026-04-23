import { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
  gateway: { type: String, required: true },
  transactionDate: { type: Date, required: true },
  accountNumber: { type: String, default: null },
  subAccount: { type: String, default: null },
  amountIn: { type: Number, default: 0 },
  amountOut: { type: Number, default: 0 },
  accumulated: { type: Number, default: 0 },
  code: { type: String, default: null },
  transactionContent: { type: String, default: null },
  referenceNumber: { type: String, default: null, unique: true, sparse: true },
  body: { type: String, default: null },
}, { timestamps: true });

// Index cho truy vấn theo ngày
TransactionSchema.index({ transactionDate: -1 });

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

export default Transaction;

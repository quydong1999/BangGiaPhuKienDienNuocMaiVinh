import mongoose, { Schema, model, models } from 'mongoose';

const InvoiceItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  specName: { type: String },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  recipientName: { type: String, required: true },
  customerPhone: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  invoiceDate: { type: Date, required: true, default: Date.now },
  items: { type: [InvoiceItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  createdBy: { type: String, required: true }, // Admin email
  paidAt: { type: Date }
}, { timestamps: true });

const Invoice = models.Invoice || model('Invoice', InvoiceSchema);

export default Invoice;

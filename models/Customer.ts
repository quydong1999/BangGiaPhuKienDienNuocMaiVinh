import mongoose, { Schema, model, models } from 'mongoose';

const CustomerSchema = new Schema({
  name: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  notes: { type: String },
}, { timestamps: true });

const Customer = models.Customer || model('Customer', CustomerSchema);

export default Customer;

import mongoose, { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  shortTitle: String,
  image: {
    public_id: String,
    url: String,
    secure_url: String
  },
  layout: { type: String, enum: ['table', 'gallery'], default: 'table' },
  visibleFields: { type: [String], default: ['name', 'spec', 'priceSell'] },
  filterField: String,
}, { timestamps: true });

const Category = models.Category || model('Category', CategorySchema);
export default Category;
import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  name: { type: String, required: true },
  spec: String,
  unit: String,
  priceTax: String,
  priceDiscount: String,
  priceSell: { type: String, required: true },
  image: {
    public_id: String,
    url: String,
    secure_url: String
  },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

const Product = models.Product || model('Product', ProductSchema);
export default Product;
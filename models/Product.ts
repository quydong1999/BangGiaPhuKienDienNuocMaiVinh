import mongoose, { Schema, model, models } from 'mongoose';

const PriceSchema = new Schema({
  unit: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const SpecSchema = new Schema({
  name: { type: String, required: true },
  prices: { type: [PriceSchema], required: true }
}, { _id: false });

const ProductSchema = new Schema({
  name: { type: String, required: true },
  specs: { type: [SpecSchema], required: true },
  images: {
    type: [{
      public_id: String,
      url: String,
      secure_url: String
    }],
    default: []
  },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

const Product = models.Product || model('Product', ProductSchema);
export default Product;
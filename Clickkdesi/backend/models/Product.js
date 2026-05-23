import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  mrp: {
    type: Number,
    required: true   // ✅ IMPORTANT
  },

  image: String,

  hoverImage: String,

  imagePublicId: String,

  hoverImagePublicId: String,

  imageAlt: String,

  description: String,

  category: String
},
{ timestamps: true });

productSchema.index({ category: 1, createdAt: -1, _id: -1 });
productSchema.index({ updatedAt: -1 });

export default mongoose.model("Product", productSchema);

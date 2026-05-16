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

  description: String,

  category: String
},
{ timestamps: true });

export default mongoose.model("Product", productSchema);
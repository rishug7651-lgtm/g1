import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

  /* ================= PRODUCTS ================= */

  products: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      size: String   // ⭐ NEW
    }
  ],

  /* ================= CUSTOMER ================= */

  shippingAddress: {
    name: String,

    email: {          // ✅ REQUIRED FOR MAIL
      type: String,
      required: true
    },

    phone: String,
    address: String,
    city: String,
    pincode: String
  },

  /* ================= PAYMENT ================= */

  totalAmount: Number,

  couponCode: {
  type: String,
  default: ""
},

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  razorpayOrderId: String,
  paymentId: String,

  /* ================= ORDER FLOW ================= */

  orderStatus: {
    type: String,
    enum: [
      "processing",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ],
    default: "processing"
  },

  /* ================= INVOICE ================= */


  
  invoiceUrl: String,

/* ✅ GOOGLE SHEET PROTECTION */
sheetSaved: {
  type: Boolean,
  default: false
},

sheetSaveInProgress: {
  type: Boolean,
  default: false
},

sheetSaveStartedAt: Date,

confirmationEmailSentAt: Date,

adminEmailSentAt: Date,

}, { timestamps: true });

orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ paymentStatus: 1, sheetSaved: 1, paymentId: 1, updatedAt: 1 });

export default mongoose.model("Order", orderSchema);

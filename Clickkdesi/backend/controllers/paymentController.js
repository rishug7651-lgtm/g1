import crypto from "crypto";
import Order from "../models/Order.js";

const buildOrderSummary = (order) => ({
  _id: order._id,
  products: order.products?.map((product) => ({
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    size: product.size,
  })),
  shippingAddress: {
    name: order.shippingAddress?.name,
    email: order.shippingAddress?.email,
  },
  totalAmount: order.totalAmount,
  paymentStatus: order.paymentStatus,
});



export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    /* ================= SIGNATURE VERIFY ================= */

    const sign = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_SECRET
      )
      .update(
        razorpay_order_id +
        "|" +
        razorpay_payment_id
      )
      .digest("hex");

    if (sign !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed"
      });

      return res.status(400).json({
        message: "Payment Failed"
      });
    }

    console.log("✅ Signature Verified (Backup API)");

    /* ================= FETCH ORDER ================= */

    const order = await Order.findById(orderId);

    if (!order)
      return res.status(404).json({
        message: "Order not found"
      });

    /* ================= ONLY UPDATE STATUS ================= */

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paymentId = razorpay_payment_id;
      await order.save();

      console.log("✅ ORDER UPDATED (Backup)");
    }

    /* ================= NO SHEET / NO EMAIL ================= */

    return res.json({
      success: true,
      message: "Payment Verified (Backup Only)",
      order: buildOrderSummary(order)
    });

  } catch (err) {
    console.log("🚨 VERIFY ERROR:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Verification Error"
      });
    }
  }
};

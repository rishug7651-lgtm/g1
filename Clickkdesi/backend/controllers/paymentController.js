import crypto from "crypto";
import Order from "../models/Order.js";
import {
  buildOrderSummary,
  fulfillPaidOrder,
} from "../services/orderFulfillment.js";

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (sign !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
      });

      return res.status(400).json({
        message: "Payment Failed",
      });
    }

    const { order } = await fulfillPaidOrder({
      orderId,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      source: "verify",
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      message: "Payment verified",
      order: buildOrderSummary(order),
    });
  } catch (err) {
    console.log("VERIFY ERROR:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Verification Error",
      });
    }
  }
};

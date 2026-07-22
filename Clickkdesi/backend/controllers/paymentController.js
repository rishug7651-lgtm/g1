import crypto from "crypto";
import Order from "../models/Order.js";
import {
  buildOrderSummary,
  fulfillPaidOrder,
} from "../services/orderFulfillment.js";

const timingSafeHexEqual = (actual, expected) => {
  const actualValue = String(actual || "");
  const expectedValue = String(expected || "");

  if (!/^[a-f0-9]{64}$/i.test(actualValue) || !/^[a-f0-9]{64}$/i.test(expectedValue)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(actualValue, "hex"),
    Buffer.from(expectedValue, "hex")
  );
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        message: "Payment details missing",
      });
    }

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const signatureMatches = timingSafeHexEqual(sign, razorpay_signature);

    if (!signatureMatches) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
      });

      return res.status(400).json({
        message: "Payment Failed",
      });
    }

    const existingOrder = await Order.findById(orderId)
      .select("razorpayOrderId")
      .lean();

    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (String(existingOrder.razorpayOrderId || "") !== razorpay_order_id) {
      return res.status(400).json({
        message: "Payment/order mismatch",
      });
    }

    const { order } = await fulfillPaidOrder({
      orderId,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      source: "verify",
    });

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

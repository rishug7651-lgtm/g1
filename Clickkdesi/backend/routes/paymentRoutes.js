import dotenv from "dotenv";
dotenv.config();

import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

import Order from "../models/Order.js";
import { verifyPayment } from "../controllers/paymentController.js";
import { noStore } from "../middleware/responseOptimization.js";
import { fulfillPaidOrder } from "../services/orderFulfillment.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

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

router.post("/create-order", noStore, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "OrderId missing" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "pending") {
      return res.status(409).json({ message: "Order is not payable" });
    }

    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
    });
  } catch (err) {
    console.log("CREATE ORDER ERROR:", err);
    return res.status(500).json({ message: "Payment Init Failed" });
  }
});

router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (!timingSafeHexEqual(expectedSignature, signature)) {
        console.log("Invalid webhook signature");
        return res.status(400).send("Invalid signature");
      }

      const body = JSON.parse(req.body.toString());
      const event = body.event;

      console.log("Webhook Event:", event);

      if (event === "payment.captured") {
        const payment = body.payload.payment.entity;

        const { order } = await fulfillPaidOrder({
          razorpayOrderId: payment.order_id,
          paymentId: payment.id,
          source: "webhook",
        });

        if (!order) {
          console.log("Order not found");
          return res.json({ status: "ok" });
        }
      } else if (event === "payment.failed") {
        const payment = body.payload.payment.entity;

        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { paymentStatus: "failed" }
        );

        console.log("Payment marked failed");
      }

      return res.json({ status: "ok" });
    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.status(500).send("Webhook Error");
    }
  }
);

router.post("/verify", noStore, verifyPayment);

router.post("/payment-failed", noStore, async (req, res) => {
  try {
    const { orderId, razorpayOrderId } = req.body;

    if (!orderId || !razorpayOrderId) {
      return res.status(400).json({ message: "Payment details missing" });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        razorpayOrderId,
        paymentStatus: { $ne: "paid" },
      },
      { paymentStatus: "failed" }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Payment marked failed" });
  } catch (err) {
    return res.status(500).json({ message: "Error updating payment" });
  }
});

export default router;

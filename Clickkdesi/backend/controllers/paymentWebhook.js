import crypto from "crypto";
import Order from "../models/Order.js";
import { fulfillPaidOrder } from "../services/orderFulfillment.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.log("Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const body = JSON.parse(req.body.toString());
    const event = body.event;

    console.log("Webhook Event:", event);

    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;

      await fulfillPaidOrder({
        razorpayOrderId: payment.order_id,
        paymentId: payment.id,
        source: "webhook-controller",
      });
    } else if (event === "payment.failed") {
      const payment = body.payload.payment.entity;

      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: "failed" }
      );
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.status(500).send("Webhook Error");
  }
};

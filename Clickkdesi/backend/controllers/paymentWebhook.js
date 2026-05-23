import crypto from "crypto";
import Order from "../models/Order.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { sendOrderMail } from "../utils/sendEmail.js";
import { syncOrderToSheetOnce } from "../utils/sheetSync.js";

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
      const paymentId = payment.id;
      const razorpayOrderId = payment.order_id;

      console.log("Payment Captured:", paymentId);

      const order = await Order.findOne({
        razorpayOrderId,
      });

      if (!order) {
        console.log("Order not found for webhook");
        return res.status(200).json({ status: "ok" });
      }

      if (order.paymentStatus === "paid" && order.sheetSaved) {
        console.log("Already fully processed");
        return res.status(200).json({ status: "ok" });
      }

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        order.paymentId = paymentId;

        await generateInvoice(order);
        order.invoiceUrl = `/invoices/invoice-${order._id}.pdf`;

        await order.save();
        console.log("Order updated by webhook");
      } else if (!order.paymentId) {
        order.paymentId = paymentId;
        await order.save();
      }

      if (!order.sheetSaved) {
        const { saved: sheetSuccess, skipped } =
          await syncOrderToSheetOnce(order._id);

        if (skipped) {
          console.log("Sheet sync skipped");
        } else {
          console.log("Sheet updated:", sheetSuccess);
        }
      }

      try {
        const invoicePath = `./invoices/invoice-${order._id}.pdf`;

        await sendOrderMail(order.shippingAddress.email, order, invoicePath);
        await sendOrderMail(process.env.ADMIN_EMAIL, order, invoicePath);

        console.log("Emails sent");
      } catch (err) {
        console.log("Email failed:", err.message);
      }
    } else if (event === "payment.failed") {
      const payment = body.payload.payment.entity;

      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: "failed" }
      );

      console.log("Payment failed updated");
    } else {
      console.log("Ignored event:", event);
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.log("WEBHOOK ERROR:", err.message);
    return res.status(500).send("Webhook Error");
  }
};

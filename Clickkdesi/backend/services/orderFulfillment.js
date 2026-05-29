import Order from "../models/Order.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import { sendOrderMail } from "../utils/sendEmail.js";
import { syncOrderToSheetOnce } from "../utils/sheetSync.js";

const fulfillmentLocks = new Map();

export const buildOrderSummary = (order) => ({
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

const sendConfirmationEmails = async (order, invoicePath) => {
  let changed = false;

  if (!process.env.MAILERSEND_API_KEY) {
    return changed;
  }

  if (order.shippingAddress?.email && !order.confirmationEmailSentAt) {
    await sendOrderMail(order.shippingAddress.email, order, invoicePath);
    order.confirmationEmailSentAt = new Date();
    changed = true;
  }

  if (process.env.ADMIN_EMAIL && !order.adminEmailSentAt) {
    await sendOrderMail(process.env.ADMIN_EMAIL, order, invoicePath);
    order.adminEmailSentAt = new Date();
    changed = true;
  }

  return changed;
};

const fulfillPaidOrderOnce = async ({
  orderId,
  razorpayOrderId,
  paymentId,
  source = "payment",
}) => {
  const query = orderId ? { _id: orderId } : { razorpayOrderId };
  const order = await Order.findOne(query);

  if (!order) {
    return { order: null, fulfilled: false };
  }

  let changed = false;

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    changed = true;
  }

  if (paymentId && !order.paymentId) {
    order.paymentId = paymentId;
    changed = true;
  }

  if (razorpayOrderId && !order.razorpayOrderId) {
    order.razorpayOrderId = razorpayOrderId;
    changed = true;
  }

  if (changed) {
    await order.save();
    console.log(`Order marked paid from ${source}:`, order._id);
  }

  let invoicePath;

  try {
    invoicePath = await generateInvoice(order);

    if (!order.invoiceUrl) {
      order.invoiceUrl = `/invoices/invoice-${order._id}.pdf`;
      await order.save();
    }
  } catch (err) {
    console.log("Invoice generation failed:", err.message);
  }

  if (!order.sheetSaved) {
    const { saved, skipped } = await syncOrderToSheetOnce(order._id);

    if (skipped) {
      console.log("Sheet sync skipped:", order._id);
    } else {
      console.log("Sheet sync result:", { orderId: order._id, saved });
    }
  }

  if (invoicePath) {
    try {
      const emailChanged = await sendConfirmationEmails(order, invoicePath);

      if (emailChanged) {
        await order.save();
      }
    } catch (err) {
      console.log("Confirmation email failed:", {
        message: err?.message || String(err),
        code: err?.code,
        status: err?.status,
      });
    }
  }

  return { order, fulfilled: true };
};

export const fulfillPaidOrder = (options) => {
  const key = String(options.orderId || options.razorpayOrderId || "");

  if (!key) {
    return Promise.resolve({ order: null, fulfilled: false });
  }

  const active = fulfillmentLocks.get(key);

  if (active) return active;

  const task = fulfillPaidOrderOnce(options).finally(() => {
    fulfillmentLocks.delete(key);
  });

  fulfillmentLocks.set(key, task);

  return task;
};

import Order from "../models/Order.js";
import { generateInvoice } from "../utils/generateInvoice.js";
import {
  getMailCcEmail,
  getMailConfigIssue,
  sendOrderMail,
} from "../utils/sendEmail.js";
import { syncOrderToSheetOnce } from "../utils/sheetSync.js";

const fulfillmentLocks = new Map();

const toValidDate = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

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

const getEmailErrorLog = (err) => ({
  message: err?.message || String(err),
  code: err?.code,
  statusCode: err?.statusCode || err?.status,
  body: err?.body,
});

const sendConfirmationEmails = async (order, invoicePath) => {
  const configIssue = getMailConfigIssue();

  if (configIssue) {
    console.log("Confirmation email skipped:", {
      orderId: String(order._id),
      reason: configIssue,
    });
    return false;
  }

  const customerEmail = order.shippingAddress?.email;

  if (!customerEmail || order.confirmationEmailSentAt) {
    return false;
  }

  try {
    await sendOrderMail(customerEmail, order, invoicePath);
    order.confirmationEmailSentAt = new Date();

    if (getMailCcEmail(customerEmail) && !order.adminEmailSentAt) {
      order.adminEmailSentAt = order.confirmationEmailSentAt;
    }

    return true;
  } catch (err) {
    console.log("Customer confirmation email failed:", {
      orderId: String(order._id),
      recipient: "customer",
      ...getEmailErrorLog(err),
    });
    return false;
  }
};

const fulfillPaidOrderOnce = async ({
  orderId,
  razorpayOrderId,
  paymentId,
  paidAt,
  source = "payment",
}) => {
  const query = orderId ? { _id: orderId } : { razorpayOrderId };
  const order = await Order.findOne(query);

  if (!order) {
    return { order: null, fulfilled: false };
  }

  let changed = false;
  const paymentTimestamp = toValidDate(paidAt) || new Date();

  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paidAt = paymentTimestamp;
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
      console.log("Confirmation email processing failed:", {
        orderId: String(order._id),
        ...getEmailErrorLog(err),
      });
    }
  } else {
    console.log("Confirmation email skipped:", {
      orderId: String(order._id),
      reason: "invoice not available",
    });
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

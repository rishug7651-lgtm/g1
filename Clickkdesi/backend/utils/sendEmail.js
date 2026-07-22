import fs from "fs";
import {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
  Attachment,
} from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendOrderMail = async (to, order, invoicePath) => {
  const sentFrom = new Sender(
    process.env.MAILERSEND_FROM_EMAIL || "test-q3enl6kd7qr42vwr.mlsender.net",
    process.env.MAILERSEND_FROM_NAME || "Pankuri Store"
  );
  const recipients = [new Recipient(to)];
  const invoiceBuffer = fs.readFileSync(invoicePath);
  const attachments = [
    new Attachment(invoiceBuffer.toString("base64"), "invoice.pdf"),
  ];
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Order Confirmed")
    .setHtml(`
      <h2>Order Confirmed</h2>
      <p>Hello ${escapeHtml(order.shippingAddress?.name)}</p>
      <p>Order ID: ${escapeHtml(order._id)}</p>
      <p>Total: Rs. ${escapeHtml(order.totalAmount)}</p>
    `)
    .setAttachments(attachments);

  return mailerSend.email.send(emailParams);
};

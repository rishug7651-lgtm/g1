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
      <p>Hello ${order.shippingAddress.name}</p>
      <p>Order ID: ${order._id}</p>
      <p>Total: Rs. ${order.totalAmount}</p>
    `)
    .setAttachments(attachments);

  return mailerSend.email.send(emailParams);
};

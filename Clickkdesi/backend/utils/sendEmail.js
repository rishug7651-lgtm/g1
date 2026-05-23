import fs from "fs";
import {
  MailerSend,
  EmailParams,
  Sender,
  Recipient,
  Attachment
} from "mailersend";

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

export const sendOrderMail = async (to, order, invoicePath) => {

  try {

    /* ✅ CORRECT SENDER DOMAIN */
    const sentFrom = new Sender(
      "test-q3enl6kd7qr42vwr.mlsender.net",
      "Pankuri Store"
    );

    const recipients = [
      new Recipient(to)
    ];

    const invoiceBuffer =
      fs.readFileSync(invoicePath);

    const attachments = [
      new Attachment(
        invoiceBuffer.toString("base64"),
        "invoice.pdf"
      )
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Order Confirmed ✅")
      .setHtml(`
        <h2>Order Confirmed 🎉</h2>
        <p>Hello ${order.shippingAddress.name}</p>
        <p>Order ID: ${order._id}</p>
        <p>Total: ₹${order.totalAmount}</p>
      `)
      .setAttachments(attachments);

    const response =
      await mailerSend.email.send(emailParams);

    // console.log("✅ Email Sent:", response);

  } catch (err) {

    // console.log("🚨 FULL ERROR:");
    // console.log(err);
  }
};
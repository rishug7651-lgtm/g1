import fs from "fs";

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";
const DEFAULT_FROM_EMAIL = "clickkdesi24@gmail.com";
const DEFAULT_FROM_NAME = "Clickkdesi";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getMailConfig = () => ({
  serviceId: String(process.env.EMAILJS_SERVICE_ID || "").trim(),
  templateId: String(process.env.EMAILJS_TEMPLATE_ID || "").trim(),
  publicKey: String(process.env.EMAILJS_PUBLIC_KEY || "").trim(),
  privateKey: String(process.env.EMAILJS_PRIVATE_KEY || "").trim(),
  fromEmail: normalizeEmail(process.env.EMAILJS_FROM_EMAIL) || DEFAULT_FROM_EMAIL,
  fromName:
    String(process.env.EMAILJS_FROM_NAME || "").trim() || DEFAULT_FROM_NAME,
  adminEmail: normalizeEmail(process.env.ADMIN_EMAIL),
  ccEmail:
    normalizeEmail(process.env.EMAILJS_CC_EMAIL) ||
    normalizeEmail(process.env.ADMIN_EMAIL) ||
    DEFAULT_FROM_EMAIL,
});

export const isValidEmail = (value) => EMAIL_PATTERN.test(normalizeEmail(value));

export const getMailConfigIssue = () => {
  const config = getMailConfig();

  if (!config.serviceId) {
    return "EMAILJS_SERVICE_ID missing";
  }

  if (!config.templateId) {
    return "EMAILJS_TEMPLATE_ID missing";
  }

  if (!config.publicKey) {
    return "EMAILJS_PUBLIC_KEY missing";
  }

  if (!isValidEmail(config.fromEmail)) {
    return "EMAILJS_FROM_EMAIL must be a valid email address";
  }

  if (config.ccEmail && !isValidEmail(config.ccEmail)) {
    return "EMAILJS_CC_EMAIL or ADMIN_EMAIL must be a valid email address";
  }

  return null;
};

export const getMailConfigStatus = () => {
  const config = getMailConfig();
  const fromEmailConfigured = Boolean(
    String(process.env.EMAILJS_FROM_EMAIL || "").trim()
  );
  const ccEmailConfigured = Boolean(
    String(process.env.EMAILJS_CC_EMAIL || "").trim()
  );

  return {
    provider: "emailjs",
    emailJsServiceIdConfigured: Boolean(config.serviceId),
    emailJsTemplateIdConfigured: Boolean(config.templateId),
    emailJsPublicKeyConfigured: Boolean(config.publicKey),
    emailJsPrivateKeyConfigured: Boolean(config.privateKey),
    emailJsFromEmailConfigured: fromEmailConfigured,
    emailJsFromEmailSource: fromEmailConfigured ? "env" : "default",
    emailJsFromEmailValid: isValidEmail(config.fromEmail),
    emailJsFromNameConfigured: Boolean(
      String(process.env.EMAILJS_FROM_NAME || "").trim()
    ),
    emailJsCcEmailConfigured: ccEmailConfigured,
    emailJsCcEmailSource: ccEmailConfigured
      ? "env"
      : config.adminEmail
        ? "admin_email"
        : "default",
    emailJsCcEmailValid: isValidEmail(config.ccEmail),
    adminEmailConfigured: Boolean(config.adminEmail),
    adminEmailValid: !config.adminEmail || isValidEmail(config.adminEmail),
  };
};

export const getMailCcEmail = (primaryEmail) => {
  const config = getMailConfig();
  const normalizedPrimaryEmail = normalizeEmail(primaryEmail);

  if (!config.ccEmail || config.ccEmail === normalizedPrimaryEmail) {
    return "";
  }

  return config.ccEmail;
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const formatAmount = (value) => Number(value || 0).toFixed(2);

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildOrderItems = (products = []) =>
  products.map((product) => {
    const quantity = Number(product.quantity || 1);
    const price = Number(product.price || 0);

    return {
      name: product.name || "Product",
      units: quantity,
      quantity,
      size: product.size || "default",
      price,
      price_text: formatMoney(price),
      line_total: price * quantity,
      line_total_text: formatMoney(price * quantity),
    };
  });

const buildOrderItemsText = (items) =>
  items
    .map(
      (item) =>
        `${item.name} (${item.size}) x ${item.quantity} - ${item.line_total_text}`
    )
    .join("\n");

const buildOrderItemsHtml = (items) =>
  `<ul>${items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> (${escapeHtml(
          item.size
        )}) x ${escapeHtml(item.quantity)} - ${escapeHtml(
          item.line_total_text
        )}</li>`
    )
    .join("")}</ul>`;

const readInvoiceAttachment = (invoicePath, orderId) => {
  if (!invoicePath || !fs.existsSync(invoicePath)) {
    return {};
  }

  return {
    invoice_filename: `invoice-${orderId}.pdf`,
    invoice_pdf: fs.readFileSync(invoicePath, { encoding: "base64" }),
  };
};

export const sendOrderMail = async (to, order, invoicePath) => {
  const configIssue = getMailConfigIssue();

  if (configIssue) {
    const error = new Error(configIssue);
    error.code = "MAIL_CONFIG_INVALID";
    throw error;
  }

  const recipientEmail = normalizeEmail(to);

  if (!isValidEmail(recipientEmail)) {
    const error = new Error("Recipient email must be a valid email address");
    error.code = "MAIL_RECIPIENT_INVALID";
    throw error;
  }

  const config = getMailConfig();
  const ccEmail = getMailCcEmail(recipientEmail);
  const orderId = String(order._id);
  const items = buildOrderItems(order.products);
  const customerName = order.shippingAddress?.name || "Customer";
  const orderItemsText = buildOrderItemsText(items);
  const orderItemsHtml = buildOrderItemsHtml(items);
  const body = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    template_params: {
      to_email: recipientEmail,
      cc_email: ccEmail,
      from_email: config.fromEmail,
      from_name: config.fromName,
      reply_to: config.fromEmail,
      name: customerName,
      email: recipientEmail,
      amount: formatAmount(order.totalAmount),
      order_items: orderItemsHtml,
      customer_name: customerName,
      customer_email: recipientEmail,
      customer_phone: order.shippingAddress?.phone || "",
      shipping_address: order.shippingAddress?.address || "",
      shipping_city: order.shippingAddress?.city || "",
      shipping_pincode: order.shippingAddress?.pincode || "",
      order_id: orderId,
      order_total: order.totalAmount,
      order_total_text: formatMoney(order.totalAmount),
      coupon_code: order.couponCode || "",
      payment_status: order.paymentStatus || "paid",
      orders: items,
      order_items_list: items,
      order_items_html: orderItemsHtml,
      order_items_text: orderItemsText,
      cost: {
        shipping: 0,
        tax: 0,
        total: Number(order.totalAmount || 0),
      },
      ...readInvoiceAttachment(invoicePath, orderId),
    },
  };

  if (config.privateKey) {
    body.accessToken = config.privateKey;
  }

  const response = await fetch(EMAILJS_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(responseText || "EmailJS send failed");
    error.code = "EMAILJS_SEND_FAILED";
    error.statusCode = response.status;
    error.body = responseText;
    throw error;
  }

  return {
    statusCode: response.status,
    body: responseText,
  };
};

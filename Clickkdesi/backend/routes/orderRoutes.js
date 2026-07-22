import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { requireAdminToken } from "../middleware/adminAuth.js";
import { noStore } from "../middleware/responseOptimization.js";

const router = express.Router();

const MAX_ORDER_LIMIT = 50;
const MAX_ITEM_QUANTITY = 20;
const VALID_SIZES = new Set(["default", "XS", "S", "M", "L", "XL", "2XL", "3XL"]);
const COUPONS = {
  SUPER50: 30,
};
const ADMIN_ORDER_FIELDS =
  "products shippingAddress totalAmount couponCode paymentStatus orderStatus razorpayOrderId paymentId sheetSaved createdAt updatedAt";
const CUSTOMER_ORDER_FIELDS =
  "products.name products.price products.quantity products.size totalAmount couponCode paymentStatus orderStatus createdAt";

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
};

const sanitizeCartItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const quantity = Math.trunc(Number(item.quantity || 1));
      const size = String(item.size || "default").trim();

      return {
        productId: String(item.productId || item._id || "").trim(),
        quantity: Math.min(Math.max(quantity || 1, 1), MAX_ITEM_QUANTITY),
        size: VALID_SIZES.has(size) ? size : "default",
      };
    })
    .filter((item) => item.productId);
};

const normalizeCouponCode = (value) => {
  const code = String(value || "").trim().toUpperCase();
  return !code || code === "N/A" ? "" : code;
};

const cleanText = (value, maxLength) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const sanitizeShippingAddress = (value = {}) => {
  const shippingAddress = {
    name: cleanText(value.name, 80),
    email: cleanText(value.email, 120).toLowerCase(),
    phone: cleanText(value.phone, 20),
    address: cleanText(value.address, 300),
    pincode: cleanText(value.pincode, 12),
  };

  if (!shippingAddress.name) {
    const error = new Error("Name required");
    error.status = 400;
    throw error;
  }

  if (!/^\S+@\S+\.\S+$/.test(shippingAddress.email)) {
    const error = new Error("Valid email required");
    error.status = 400;
    throw error;
  }

  if (!/^[6-9]\d{9}$/.test(shippingAddress.phone)) {
    const error = new Error("Invalid phone number");
    error.status = 400;
    throw error;
  }

  if (!shippingAddress.address) {
    const error = new Error("Complete address required");
    error.status = 400;
    throw error;
  }

  if (!/^\d{6}$/.test(shippingAddress.pincode)) {
    const error = new Error("Invalid pincode");
    error.status = 400;
    throw error;
  }

  return shippingAddress;
};

const buildTrustedOrderItems = async (cartItems) => {
  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  if (!productIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    const error = new Error("Invalid product in cart");
    error.status = 400;
    throw error;
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price")
    .lean();
  const productById = new Map(
    products.map((product) => [String(product._id), product])
  );

  return cartItems.map((item) => {
    const product = productById.get(item.productId);

    if (!product) {
      const error = new Error("Invalid product in cart");
      error.status = 400;
      throw error;
    }

    return {
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      size: item.size,
    };
  });
};

/* ================= CREATE ORDER ================= */
router.post("/", noStore, async (req, res) => {
  try {
    const cartItems = sanitizeCartItems(req.body.products);

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const products = await buildTrustedOrderItems(cartItems);
    const shippingAddress = sanitizeShippingAddress(req.body.shippingAddress);
    const subtotal = products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    const couponCode = normalizeCouponCode(req.body.couponCode);

    if (couponCode && !COUPONS[couponCode]) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    const discount = Math.min(COUPONS[couponCode] || 0, subtotal);
    const totalAmount = subtotal - discount;

    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    const order = await Order.create({
      products,
      shippingAddress,
      totalAmount,
      paymentStatus: "pending",
      couponCode,
    });

    res.status(201).json({
      success: true,
      orderId: order._id,
    });
  } catch (err) {
    console.log(err);

    res.status(err.status || 500).json({
      message: "Order creation failed",
    });
  }
});

/* ================= ADMIN: GET ORDERS ================= */
router.get("/", requireAdminToken, noStore, async (req, res) => {
  try {
    const page = clampNumber(req.query.page, 1, 1, 1000);
    const limit = clampNumber(req.query.limit, 20, 1, MAX_ORDER_LIMIT);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .select(ADMIN_ORDER_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* ================= GET ORDER BY ID ================= */
router.get("/:id", noStore, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select(CUSTOMER_ORDER_FIELDS)
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default router;

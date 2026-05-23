import express from "express";
import Order from "../models/Order.js";
import { requireAdminToken } from "../middleware/adminAuth.js";
import { noStore } from "../middleware/responseOptimization.js";

const router = express.Router();

const MAX_ORDER_LIMIT = 50;
const ADMIN_ORDER_FIELDS =
  "products shippingAddress totalAmount couponCode paymentStatus orderStatus razorpayOrderId paymentId sheetSaved createdAt updatedAt";
const CUSTOMER_ORDER_FIELDS =
  "products.name products.price products.quantity products.size shippingAddress.name shippingAddress.email totalAmount couponCode paymentStatus orderStatus createdAt";

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
};

const sanitizeCartItems = (items = []) =>
  items.map((item) => ({
    productId: String(item.productId || item._id || ""),
    name: String(item.name || ""),
    price: Number(item.price || 0),
    quantity: Math.min(Math.max(Number(item.quantity || 1), 1), 20),
    size: String(item.size || "default"),
  }));

/* ================= CREATE ORDER ================= */
router.post("/", noStore, async (req, res) => {
  try {
    const products = sanitizeCartItems(req.body.products);

    if (!products.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await Order.create({
      products,
      shippingAddress: req.body.shippingAddress,
      totalAmount: Number(req.body.totalAmount || 0),
      paymentStatus: "pending",
      couponCode: req.body.couponCode || "",
    });

    res.status(201).json({
      success: true,
      orderId: order._id,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
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

import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* ================= CREATE ORDER ================= */

router.post("/", async (req, res) => {

  try {

    const order = await Order.create({
      products: req.body.products,
      shippingAddress: req.body.shippingAddress,
      totalAmount: req.body.totalAmount,
      paymentStatus: "pending",

       couponCode:
    req.body.couponCode || ""
    });

    res.status(201).json({
      success: true,
      orderId: order._id
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Order creation failed"
    });
  }
});


/* ================= GET ALL ORDERS ================= */

router.get("/", async (req, res) => {

  const orders =
    await Order.find()
      .sort({ createdAt: -1 });

  res.json(orders);
});


/* ✅ ================= GET ORDER BY ID ================= */

router.get("/:id", async (req, res) => {

  try {

    const order =
      await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found" });
    }

    res.json(order);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

export default router;
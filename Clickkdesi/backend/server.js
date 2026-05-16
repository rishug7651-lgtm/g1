import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import "./utils/sheetRetryWorker.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { saveOrderToSheet } from "./utils/googleSheet.js";
import shareRouter from "./routes/share.js";

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ✅ MUST be before app.use("/api/products", ...)
app.use("/product", shareRouter);

/* ================= STATIC ================= */
app.use("/photos", express.static(path.join(__dirname, "photos")));

/* ================= CORS ================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://g1-1-ph8w.onrender.com",
      "https://e-commerce-1-ot1x.onrender.com",
      "*",
    ],
  })
);
/* ================= WEBHOOK FIRST ================= */
app.use(
  "/api/payment/razorpay-webhook",
  express.raw({ type: "application/json" })
);
/* ================= BODY ================= */
app.use(express.json());

/* ================= ROUTES ================= */
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

/* ================= TEST ================= */
app.get("/test-sheet", async (req, res) => {
  await saveOrderToSheet({
    _id: "TEST123",
    shippingAddress: {
      name: "Test User",
      email: "test@gmail.com",
      phone: "9999999999",
      city: "Delhi",
    },
    products: [{ name: "Kurti", size: "M" }],
    totalAmount: 999,
    couponCode: "TEST",
    paymentStatus: "paid",
    paymentId: "TESTPAY",
  });

  res.send("✅ Sheet Test Sent");
});

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.send("✅ Backend Running");
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

/* ================= START ================= */
const startServer = async () => {
  try {
    await connectDB({ label: "MongoDB" });

    app.listen(PORT, () => {
      console.log(`🚀 Server Running on ${PORT}`);
    });
  } catch (error) {
    console.log("❌ Server Start Error:", error);
    process.exit(1);
  }
};

startServer();

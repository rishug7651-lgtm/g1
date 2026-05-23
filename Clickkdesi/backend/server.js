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
import shareRouter from "./routes/share.js";

import { saveOrderToSheet } from "./utils/googleSheet.js";

import {
  compressionMiddleware,
  noStore,
  securityHeaders,
} from "./middleware/responseOptimization.js";

import { rateLimit } from "./middleware/rateLimit.js";
import { requireAdminToken } from "./middleware/adminAuth.js";

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= ALLOWED ORIGINS ================= */

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://g1-1-ph8w.onrender.com",
  "https://e-commerce-1-ot1x.onrender.com",
  "https://s4-zdqq.onrender.com",
];

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

/* ================= PATH FIX ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= BASIC SECURITY ================= */

app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ================= CORS (MOVE TO TOP) ================= */

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (Postman/mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    credentials: true,
  })
);

/* ================= SECURITY HEADERS ================= */

app.use(securityHeaders);

/* ================= COMPRESSION ================= */

app.use(compressionMiddleware);

/* ================= RATE LIMITERS ================= */

const apiLimiter = rateLimit({
  keyPrefix: "api",
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 180),
});

const paymentLimiter = rateLimit({
  keyPrefix: "payment",
  windowMs: 60 * 1000,
  max: Number(process.env.PAYMENT_RATE_LIMIT_PER_MINUTE || 40),
});

const shareLimiter = rateLimit({
  keyPrefix: "share",
  windowMs: 60 * 1000,
  max: Number(process.env.SHARE_RATE_LIMIT_PER_MINUTE || 60),
});

const photoLimiter = rateLimit({
  keyPrefix: "photos",
  windowMs: 60 * 1000,
  max: Number(process.env.PHOTO_RATE_LIMIT_PER_MINUTE || 240),
});

/* ================= SHARE ROUTES ================= */

app.use("/product", shareLimiter, shareRouter);

/* ================= STATIC FILES ================= */

app.use(
  "/photos",
  photoLimiter,
  express.static(path.join(__dirname, "photos"), {
    etag: true,
    immutable: true,
    lastModified: true,
    maxAge: "365d",

    setHeaders: (res) => {
      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    },
  })
);

/* ================= WEBHOOK ================= */

app.use(
  "/api/payment/razorpay-webhook",
  express.raw({ type: "application/json" })
);

/* ================= BODY PARSER ================= */

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "64kb",
  })
);

/* ================= API ROUTES ================= */

app.use("/api/products", apiLimiter, productRoutes);

app.use("/api/orders", apiLimiter, orderRoutes);

app.use("/api/payment", paymentLimiter, paymentRoutes);

/* ================= HEALTH ================= */

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    message: "Server healthy",
  });
});

/* ================= TEST ROUTE ================= */

app.get(
  "/test-sheet",
  requireAdminToken,
  noStore,
  async (req, res, next) => {
    try {
      await saveOrderToSheet({
        _id: "TEST123",

        shippingAddress: {
          name: "Test User",
          email: "test@gmail.com",
          phone: "9999999999",
          city: "Delhi",
        },

        products: [
          {
            name: "Kurti",
            size: "M",
          },
        ],

        totalAmount: 999,
        couponCode: "TEST",
        paymentStatus: "paid",
        paymentId: "TESTPAY",
      });

      res.send("Sheet Test Sent");
    } catch (error) {
      next(error);
    }
  }
);

/* ================= 404 HANDLER ================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

/* ================= START SERVER ================= */

const startServer = async () => {
  try {
    await connectDB({ label: "MongoDB" });

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
    process.exit(1);
  }
};

startServer();
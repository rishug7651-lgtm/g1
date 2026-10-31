import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import "./utils/sheetRetryWorker.js";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import shareRouter from "./routes/share.js";

import {
  getGoogleCredentialSource,
  getGoogleSheetCredentialStatus,
  hasLegacyGoogleServiceAccountJson,
  saveOrderToSheet,
} from "./utils/googleSheet.js";
import { getMailConfigStatus } from "./utils/sendEmail.js";

import {
  compressionMiddleware,
  noStore,
  securityHeaders,
} from "./middleware/responseOptimization.js";

import { rateLimit } from "./middleware/rateLimit.js";
import { requireAdminToken } from "./middleware/adminAuth.js";
import { legacyPhotoPublicIds } from "./config/productCatalog.js";

const app = express();
const PORT = process.env.PORT || 5000;
const DEPLOYMENT_MARKER = "sheet-sync-credential-logs-2026-05-29";

const getSheetConfigStatus = () => {
  const googleCredentialSource = getGoogleCredentialSource();

  return {
    adminApiTokenConfigured: Boolean(process.env.ADMIN_API_TOKEN),
    googleSheetIdConfigured: Boolean(process.env.GOOGLE_SHEET_ID),
    googleCredentialSource,
    ...getGoogleSheetCredentialStatus(),
    legacyGoogleServiceAccountJsonIgnored: hasLegacyGoogleServiceAccountJson(),
    sheetRetryEnabled: process.env.SHEET_RETRY_ENABLED !== "false",
  };
};

/* ================= ALLOWED ORIGINS ================= */

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://g1-1-ph8w.onrender.com",
  "https://clickkdesistore.in",
  "https://www.clickkdesistore.in"
];

const normalizeOrigin = (value) => {
  const origin = String(value || "").trim().replace(/\/+$/, "");

  if (!origin) return "";

  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
};

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean)
);

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

      if (allowedOrigins.has(normalizeOrigin(origin))) {
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

/* ================= LEGACY MEDIA REDIRECTS ================= */

app.get("/photos/:filename", photoLimiter, (req, res) => {
  const publicId = legacyPhotoPublicIds[req.params.filename];
  const redirectUrl = `${(process.env.PUBLIC_FRONTEND_URL || "https://clickkdesistore.in").replace(/\/$/, "")}${publicId}`;

  if (!redirectUrl) {
    return res.status(410).json({
      success: false,
      message: "Media not found",
    });
  }

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.redirect(301, redirectUrl);
});

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
    deploymentMarker: DEPLOYMENT_MARKER,
    gitCommit: process.env.RENDER_GIT_COMMIT || null,
    sheetConfig: getSheetConfigStatus(),
    mailConfig: getMailConfigStatus(),
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

    console.log("Sheet config status:", getSheetConfigStatus());
    console.log("Mail config status:", getMailConfigStatus());

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
    process.exit(1);
  }
};

startServer();

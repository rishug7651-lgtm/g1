import crypto from "crypto";
import express from "express";
import Product from "../models/Product.js";
import { publicCache } from "../middleware/responseOptimization.js";
import { getMediaPath } from "../utils/media.js";

const router = express.Router();

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;
const PRODUCT_LIST_TTL_SECONDS = Number(process.env.PRODUCT_LIST_TTL_SECONDS || 300);
const PRODUCT_DETAIL_TTL_SECONDS = Number(process.env.PRODUCT_DETAIL_TTL_SECONDS || 600);
const LIST_FIELDS =
  "name price mrp image imagePublicId hoverImage hoverImagePublicId imageAlt category updatedAt";
const DETAIL_FIELDS =
  "name price mrp image imagePublicId hoverImage hoverImagePublicId imageAlt description category updatedAt";

const responseCache = new Map();

const backendURL = (process.env.PUBLIC_BACKEND_URL || "https://g1-x5ol.onrender.com").replace(
  /\/$/,
  ""
);
const frontendURL = (
  process.env.PUBLIC_FRONTEND_URL || "https://clickkdesistore.in"
).replace(/\/$/, "");

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
};

const cleanMetaText = (value, fallback = "") =>
  String(value || fallback)
    .replace(/[\u2022\u2023\u25e6\u2043\u2219]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const serializeProduct = (product) => {
  const image = getMediaPath(product.image || product.imagePublicId);
  const hoverImage = getMediaPath(product.hoverImage || product.hoverImagePublicId) || image;

  return {
    ...product,
    imageAlt: product.imageAlt || product.name,
    image,
    hoverImage,
    imagePublicId: undefined,
    hoverImagePublicId: undefined,
  };
};

const etagFor = (payload) =>
  `"${crypto.createHash("sha256").update(payload).digest("base64url").slice(0, 32)}"`;

const sendCachedJson = async (req, res, key, ttlSeconds, producer) => {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    res.setHeader("ETag", cached.etag);
    res.setHeader(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, stale-while-revalidate=60`
    );

    if (req.headers["if-none-match"] === cached.etag) {
      return res.status(304).end();
    }

    return res.type("json").send(cached.payload);
  }

  const value = await producer();

  if (value === null) {
    return res.status(404).json({ message: "Product not found" });
  }

  const payload = JSON.stringify(value);
  const etag = etagFor(payload);

  responseCache.set(key, {
    payload,
    etag,
    expiresAt: now + ttlSeconds * 1000,
  });

  if (responseCache.size > 200) {
    for (const [cacheKey, item] of responseCache.entries()) {
      if (item.expiresAt <= now || responseCache.size > 200) {
        responseCache.delete(cacheKey);
      }
    }
  }

  res.setHeader("ETag", etag);
  res.setHeader(
    "Cache-Control",
    `public, max-age=${ttlSeconds}, stale-while-revalidate=60`
  );

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  return res.type("json").send(payload);
};

router.get("/share/:id", publicCache(60 * 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select(DETAIL_FIELDS)
      .lean();

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const safeProduct = serializeProduct(product);
    const name = cleanMetaText(
      `${safeProduct.name} - Premium Cotton Wear for Daily Comfort`
    );
    const description = cleanMetaText(
      safeProduct.description,
      "Best product available"
    ).slice(0, 160);
    const image = safeProduct.image
      ? `${frontendURL}${safeProduct.image}`
      : "https://via.placeholder.com/1200x630";
    const productUrl = `${frontendURL}/product/${safeProduct._id}`;
    const shareUrl = `${backendURL}/api/products/share/${safeProduct._id}`;

    res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(productUrl)}" />
  <link rel="canonical" href="${escapeHtml(productUrl)}" />
  <title>${escapeHtml(name)}</title>
  <meta name="title" content="${escapeHtml(name)}" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="product" />
  <meta property="product:price:amount" content="${safeProduct.price || ""}" />
  <meta property="product:price:currency" content="INR" />
  <meta property="og:availability" content="in stock" />
  <meta property="og:site_name" content="Clickkdesi" />
  <meta property="og:title" content="${escapeHtml(name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <a href="${escapeHtml(productUrl)}">Open product</a>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/", async (req, res) => {
  try {
    const page = clampNumber(req.query.page, 1, 1, 1000);
    const limit = clampNumber(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const category = String(req.query.category || "").trim();
    const skip = (page - 1) * limit;
    const query = {};

    if (category) {
      query.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    await sendCachedJson(
      req,
      res,
      `products:${category}:${page}:${limit}`,
      PRODUCT_LIST_TTL_SECONDS,
      async () => {
        const [products, total] = await Promise.all([
          Product.find(query)
            .select(LIST_FIELDS)
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(query),
        ]);

        return {
          products: products.map(serializeProduct),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(Math.ceil(total / limit), 1),
          },
        };
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await sendCachedJson(
      req,
      res,
      `product:${req.params.id}`,
      PRODUCT_DETAIL_TTL_SECONDS,
      async () => {
        const product = await Product.findById(req.params.id)
          .select(DETAIL_FIELDS)
          .lean();

        if (!product) return null;

        return serializeProduct(product);
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

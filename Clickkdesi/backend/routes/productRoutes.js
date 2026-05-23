import express from "express";
import Product from "../models/Product.js";
import { publicCache } from "../middleware/responseOptimization.js";

const router = express.Router();

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;
const LIST_FIELDS = "name price mrp image hoverImage category updatedAt";
const DETAIL_FIELDS = "name price mrp image hoverImage description category updatedAt";

const backendURL = (process.env.PUBLIC_BACKEND_URL || "https://g1-x5ol.onrender.com").replace(
  /\/$/,
  ""
);
const frontendURL = (
  process.env.PUBLIC_FRONTEND_URL || "https://e-commerce-1-ot1x.onrender.com"
).replace(/\/$/, "");
const assetBaseURL = (process.env.PUBLIC_ASSET_BASE_URL || backendURL).replace(/\/$/, "");

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

const normalizeImageUrl = (url) => {
  if (!url) return "";

  if (url.startsWith("/photos/")) {
    return `${assetBaseURL}${url}`;
  }

  try {
    const parsed = new URL(url);
    const photoMatch = parsed.pathname.match(/\/photos\/[^/?#]+$/);

    if (photoMatch && process.env.PUBLIC_ASSET_BASE_URL) {
      return `${assetBaseURL}${photoMatch[0]}`;
    }

    return url;
  } catch {
    return url;
  }
};

const serializeProduct = (product) => ({
  ...product,
  image: normalizeImageUrl(product.image),
  hoverImage: normalizeImageUrl(product.hoverImage || product.image),
});

/* =========================================================
   Share / SEO route for social previews
========================================================= */
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
    const image = safeProduct.image || "https://via.placeholder.com/1200x630";
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
  <meta property="og:image:type" content="image/jpeg" />
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

/* =========================================================
   GET PRODUCTS - paginated and lightweight by default
========================================================= */
router.get("/", publicCache(60 * 5), async (req, res) => {
  try {
    const page = clampNumber(req.query.page, 1, 1, 1000);
    const limit = clampNumber(req.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const query = {};

    if (req.query.category) {
      query.category = new RegExp(`^${String(req.query.category).trim()}$`, "i");
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .select(LIST_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      products: products.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */
router.get("/:id", publicCache(60 * 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select(DETAIL_FIELDS)
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(serializeProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

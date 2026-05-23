import express from "express";
import Product from "../models/Product.js";
import { publicCache } from "../middleware/responseOptimization.js";
import { legacyPhotoPublicIds } from "../config/productCatalog.js";
import { getCloudinaryImageUrl } from "../utils/cloudinaryMedia.js";

const router = express.Router();

const backendURL = (process.env.PUBLIC_BACKEND_URL || "https://g1-x5ol.onrender.com").replace(
  /\/$/,
  ""
);
const frontendURL = (
  process.env.PUBLIC_FRONTEND_URL || "https://e-commerce-1-ot1x.onrender.com"
).replace(/\/$/, "");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanText = (value, fallback = "") =>
  String(value || fallback)
    .replace(/[\u2022\u2023\u25e6\u2043\u2219]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getPublicIdFromLegacyUrl = (url) => {
  if (!url) return "";

  try {
    const parsed = new URL(url, "https://placeholder.local");
    const fileName = parsed.pathname.split("/").pop();
    return legacyPhotoPublicIds[fileName] || "";
  } catch {
    return "";
  }
};

router.get("/:id", publicCache(60 * 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("name price image imagePublicId description")
      .lean();

    if (!product) return res.status(404).send("Product not found");

    const imagePublicId =
      product.imagePublicId || getPublicIdFromLegacyUrl(product.image);
    const image =
      getCloudinaryImageUrl(imagePublicId, {
        width: 1200,
        height: 630,
        crop: "fill",
      }) ||
      product.image ||
      "https://via.placeholder.com/1200x630";
    const description = cleanText(product.description, "Best product available").slice(0, 160);
    const name = cleanText(`${product.name} - Premium Cotton Wear for Daily Comfort`);
    const productUrl = `${frontendURL}/product/${product._id}`;
    const shareUrl = `${backendURL}/product/${product._id}`;

    res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(productUrl)}" />
  <link rel="canonical" href="${escapeHtml(productUrl)}" />
  <title>${escapeHtml(name)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeHtml(name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:site_name" content="Clickkdesi" />
  <meta property="product:price:amount" content="${product.price || ""}" />
  <meta property="product:price:currency" content="INR" />
  <meta property="og:availability" content="in stock" />
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

export default router;

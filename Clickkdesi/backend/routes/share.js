import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const backendURL = "https://e-commerce-t99l.onrender.com";
    const frontendURL = "https://e-commerce-1-ot1x.onrender.com";

    // ✅ Clean image URL
    const image = product.image?.startsWith("http")
      ? product.image
      : `${frontendURL}${product.image}`;

    // ✅ Clean description (no bullets, no newlines)
    const description = (product.description || "")
      .replace(/[\u2022•]/g, "")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 160);

    const name = `${product.name} - Premium Cotton Wear for Daily Comfort`;
console.log("OG IMAGE URL →", image);
    // ✅ No JS redirect — using meta refresh (crawlers can read this)
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- ✅ Meta refresh redirect (works without JS) -->
  <meta http-equiv="refresh" content="0;url=${frontendURL}/product/${product._id}" />

  <!-- ✅ Canonical URL -->
  <link rel="canonical" href="${backendURL}/product/${product._id}" />

  <!-- ✅ Basic SEO -->
  <title>${name}</title>
  <meta name="description" content="${description}" />

  <!-- ✅ Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />

  <meta property="og:url" content="${backendURL}/product/${product._id}" />
  <meta property="og:site_name" content="Clickkdesi" />

  <!-- ✅ Product specific -->
  <meta property="product:price:amount" content="${product.price}" />
  <meta property="product:price:currency" content="INR" />
  <meta property="og:availability" content="in stock" />

  <!-- ✅ Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <p>Redirecting to product page...</p>
</body>
</html>`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;
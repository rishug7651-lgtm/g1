import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

/* =========================================================
   🔥 WISHLINK / SEO ROUTE (MUST BE ABOVE :id ROUTE)
========================================================= */
router.get("/share/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    /* ================= SAFE VALUES ================= */
  

    const backendURL = "https://e-commerce-t99l.onrender.com";   // ✅ your backend
    const frontendURL = "https://e-commerce-1-ot1x.onrender.com"; // ✅ your frontend


// ✅ Strong title (not short)
const name = `${product.name} - Premium Cotton Wear for Daily Comfort`;

    /* ================= IMAGE FIX (IMPORTANT) ================= */
    // ✅ Image fix (absolute URL)
const image = product.image
  ? product.image.startsWith("http")
    ? product.image
    : `${backendURL}${product.image}`
  : "https://via.placeholder.com/1200x630";

  // ✅ Clean description (NO bullets / NO new lines)
// ✅ New - catches all bullet types + trims whitespace
const description = (product.description || "Best product available")
  .replace(/[\u2022\u2023\u25E6\u2043\u2219•]/g, "")
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim()
  .slice(0, 160);

    /* ================= RESPONSE ================= */
    res.send(`
      <!DOCTYPE html>
      <html lang="en">

      <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- ✅ BASIC SEO -->
  <title>${name}</title>
  <meta name="title" content="${name}" />
  <meta name="description" content="${description}" />

<meta property="og:type" content="product" />
<meta property="product:price:amount" content="${product.price || ''}" />
<meta property="product:price:currency" content="INR" />
<meta property="og:availability" content="in stock" />
<meta property="og:site_name" content="Clickkdesi" />

  <!-- ✅ OPEN GRAPH (CRITICAL FOR WISHLINK) -->

  <meta property="og:title" content="${name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${backendURL}/api/products/share/${product._id}" />

  <!-- ✅ IMAGE OPTIMIZATION -->
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />

  <!-- ✅ TWITTER -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>

      <body style="font-family: Arial; text-align: center; padding: 40px;">
        <h1>${name}</h1>
        <img src="${image}" width="300" />
        <p>${description}</p>

        <p>Redirecting to product page...</p>

        <!-- 🔁 Redirect to React -->
        <script>
          setTimeout(() => {
            window.location.href = "${frontendURL}/product/${product._id}";
          }, 1500);
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* =========================================================
   ✅ GET ALL PRODUCTS
========================================================= */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

/* =========================================================
   ✅ GET SINGLE PRODUCT
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
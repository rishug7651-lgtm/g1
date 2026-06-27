import dotenv from "dotenv";
import Product from "../models/Product.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { productCatalog } from "../config/productCatalog.js";

dotenv.config();

const isDryRun = process.argv.includes("--dry-run");
const caseInsensitiveCollation = { locale: "en", strength: 2 };

const normalizeName = (value) => String(value || "").trim().toLowerCase();

const valuesDiffer = (currentValue, nextValue) =>
  JSON.stringify(currentValue ?? null) !== JSON.stringify(nextValue ?? null);

const productWouldChange = (existingProduct, nextProduct) => {
  const currentProduct = existingProduct.toObject();

  return (
    Boolean(currentProduct.image) ||
    Boolean(currentProduct.hoverImage) ||
    Object.entries(nextProduct).some(([key, value]) =>
      valuesDiffer(currentProduct[key], value)
    )
  );
};

const validateProductCatalog = () => {
  if (!Array.isArray(productCatalog) || productCatalog.length === 0) {
    throw new Error("Product catalog is empty. Refusing to delete all products.");
  }

  const names = new Set();
  const imagePublicIds = new Set();

  productCatalog.forEach((product, index) => {
    const name = String(product.name || "").trim();

    if (!name) {
      throw new Error(`Product at index ${index} is missing a name.`);
    }

    const normalizedName = normalizeName(name);
    if (names.has(normalizedName)) {
      throw new Error(`Duplicate product name in catalog: ${name}`);
    }
    names.add(normalizedName);

    if (product.imagePublicId) {
      if (imagePublicIds.has(product.imagePublicId)) {
        throw new Error(`Duplicate imagePublicId in catalog: ${product.imagePublicId}`);
      }
      imagePublicIds.add(product.imagePublicId);
    }
  });
};

const findExistingProduct = async (product) => {
  if (product.imagePublicId) {
    const existingByImage = await Product.findOne({
      imagePublicId: product.imagePublicId,
    }).sort({ createdAt: 1, _id: 1 });

    if (existingByImage) return existingByImage;
  }

  return Product.findOne({ name: product.name })
    .collation(caseInsensitiveCollation)
    .sort({ createdAt: 1, _id: 1 });
};

const seedProducts = async () => {
  try {
    validateProductCatalog();

    await connectDB({ label: "MongoDB seed" });

    const syncedIds = [];
    const stats = {
      matched: 0,
      modified: 0,
      inserted: 0,
      deleted: 0,
    };

    for (const product of productCatalog) {
      const existingProduct = await findExistingProduct(product);

      if (existingProduct) {
        stats.matched += 1;
        syncedIds.push(existingProduct._id);

        if (isDryRun) {
          if (productWouldChange(existingProduct, product)) {
            stats.modified += 1;
          }
        } else {
          const result = await Product.updateOne(
            { _id: existingProduct._id },
            {
              $set: product,
              $unset: {
                image: "",
                hoverImage: "",
              },
            },
            { runValidators: true }
          );

          stats.modified += result.modifiedCount;
        }

        continue;
      }

      stats.inserted += 1;

      if (!isDryRun) {
        const createdProduct = await Product.create(product);
        syncedIds.push(createdProduct._id);
      }
    }

    const staleProducts = await Product.find({
      _id: { $nin: syncedIds },
    })
      .select("name imagePublicId")
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    if (!isDryRun && staleProducts.length) {
      const deleteResult = await Product.deleteMany({
        _id: { $in: staleProducts.map((product) => product._id) },
      });

      stats.deleted = deleteResult.deletedCount;
    } else {
      stats.deleted = staleProducts.length;
    }

    console.log(isDryRun ? "Product seed dry run completed" : "Products synced successfully");
    console.log(stats);

    if (staleProducts.length) {
      console.log(
        `${isDryRun ? "Would delete" : "Deleted"} stale products:`,
        staleProducts.map((product) => ({
          name: product.name,
          imagePublicId: product.imagePublicId,
        }))
      );
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("Product seed failed");
    console.error(error.message || error);
    process.exit(1);
  }
};

seedProducts();

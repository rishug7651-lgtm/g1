import dotenv from "dotenv";
import Product from "../models/Product.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { productCatalog } from "../config/productCatalog.js";

dotenv.config();

const seedProducts = async () => {
  try {
    await connectDB({ label: "MongoDB seed" });

    const result = await Product.bulkWrite(
      productCatalog.map((product) => ({
        updateOne: {
          filter: { name: product.name },
          update: {
            $set: product,
            $unset: {
              image: "",
              hoverImage: "",
            },
          },
          upsert: true,
        },
      }))
    );

    console.log("Products updated successfully");
    console.log({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      inserted: result.upsertedCount,
    });

    await disconnectDB();
    process.exit();
  } catch (error) {
    console.error("Product seed failed");
    console.error(error.message || error);
    process.exit(1);
  }
};

seedProducts();

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const BACKEND_URL =
  (process.env.PUBLIC_BACKEND_URL || "https://g1-x5ol.onrender.com")
    .replace(/\/$/, "");
const BASE_URL = `${BACKEND_URL}/photos`;

const commonDescription = `
- Made with 100% cotton
- Lightweight, breathable
- Comfortable for all day wear
- Making each piece uniquely yours
- Customisation available
`;

const products = [
  {
    name: "Navya",
    mrp: 999,
    price: 729,
    category: "Sleeveless",
    image: `${BASE_URL}/p1.jpg`,
    hoverImage: `${BASE_URL}/p2.jpg`,
    description: commonDescription,
  },
  {
    name: "Aalya",
    mrp: 899,
    price: 719,
    category: "Full Sleeves",
    image: `${BASE_URL}/p3.jpg`,
    hoverImage: `${BASE_URL}/p4.jpg`,
    description: commonDescription,
  },
  {
    name: "Naina",
    mrp: 999,
    price: 729,
    category: "Sleeveless",
    image: `${BASE_URL}/p5.jpg`,
    hoverImage: `${BASE_URL}/p5.jpg`,
    description: commonDescription,
  },
  {
    name: "Myra",
    mrp: 849,
    price: 699,
    category: "Full Sleeves",
    image: `${BASE_URL}/p6.jpg`,
    hoverImage: `${BASE_URL}/p6.jpg`,
    description: commonDescription,
  },
  {
    name: "Tara",
    mrp: 899,
    price: 719,
    category: "Sleeveless",
    image: `${BASE_URL}/p9.jpg`,
    hoverImage: `${BASE_URL}/p9.jpg`,
    description: commonDescription,
  },
  {
    name: "Jheel",
    mrp: 999,
    price: 709,
    category: "Full Sleeves",
    image: `${BASE_URL}/p8.jpg`,
    hoverImage: `${BASE_URL}/p8.jpg`,
    description: commonDescription,
  },
  {
    name: "Siya",
    mrp: 949,
    price: 719,
    category: "Full Sleeves",
    image: `${BASE_URL}/p10.jpg`,
    hoverImage: `${BASE_URL}/p10.jpg`,
    description: commonDescription,
  },
  {
    name: "Heer",
    mrp: 899,
    price: 699,
    category: "Full Sleeves",
    image: `${BASE_URL}/p11.jpg`,
    hoverImage: `${BASE_URL}/p12.jpg`,
    description: commonDescription,
  },
  {
    name: "Saanjh",
    mrp: 999,
    price: 719,
    category: "Full Sleeves",
    image: `${BASE_URL}/p13.jpg`,
    hoverImage: `${BASE_URL}/p14.jpg`,
    description: commonDescription,
  },
  {
    name: "Gulaabo 2.0",
    mrp: 1399,
    price: 749,
    category: "Full Sleeves",
    image: `${BASE_URL}/p15.jpg`,
    hoverImage: `${BASE_URL}/p16.jpg`,
    description: commonDescription,
  },
  {
    name: "Gulaabo",
    mrp: 1399,
    price: 749,
    category: "Sleeveless",
    image: `${BASE_URL}/p17.jpg`,
    hoverImage: `${BASE_URL}/p18.jpg`,
    description: commonDescription,
  },
  {
    name: "Noori",
    mrp: 1299,
    price: 729,
    category: "Full Sleeves",
    image: `${BASE_URL}/p19.jpg`,
    hoverImage: `${BASE_URL}/p20.jpg`,
    description: commonDescription,
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const result = await Product.bulkWrite(
      products.map((product) => ({
        updateOne: {
          filter: { name: product.name },
          update: { $set: product },
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

    await mongoose.disconnect();
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedProducts();

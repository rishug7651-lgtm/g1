import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  legacyPhotoPublicIds,
  videoMediaPublicIds,
} from "../config/productCatalog.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.join(__dirname, "../../media-source");

const requiredEnv = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required to upload media to Cloudinary`);
  }
}

const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

const signUpload = (params) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
};

const uploadFile = async ({ filePath, publicId, resourceType }) => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    overwrite: "true",
    public_id: publicId,
    timestamp,
  };
  const signature = signUpload(params);
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);
  const form = new FormData();

  form.set(
    "file",
    new Blob([buffer], { type: mimeTypes[ext] || "application/octet-stream" }),
    path.basename(filePath)
  );
  form.set("api_key", process.env.CLOUDINARY_API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("public_id", publicId);
  form.set("overwrite", "true");
  form.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed for ${filePath}: ${response.status} ${text}`);
  }

  const body = await response.json();
  console.log("Uploaded", {
    publicId,
    resourceType,
    bytes: body.bytes,
    secureUrl: body.secure_url,
  });
};

const run = async () => {
  const photoEntries = Object.entries(legacyPhotoPublicIds)
    .filter(([fileName]) => !fileName.startsWith("sc.") || fileName === "sc.jpg")
    .map(([fileName, publicId]) => ({
      filePath: path.join(sourceRoot, "photos", fileName),
      publicId,
      resourceType: "image",
    }));

  const videoEntries = [
    {
      filePath: path.join(sourceRoot, "video", "v2.mp4"),
      publicId: videoMediaPublicIds.homepage,
      resourceType: "video",
    },
  ];

  for (const item of [...photoEntries, ...videoEntries]) {
    try {
      await fs.access(item.filePath);
      await uploadFile(item);
    } catch (err) {
      console.warn("Skipped", item.filePath, err.message);
    }
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

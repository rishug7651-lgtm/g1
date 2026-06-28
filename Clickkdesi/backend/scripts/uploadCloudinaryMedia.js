import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  legacyPhotoPublicIds,
  productMediaPublicId,
  videoMediaPublicIds,
} from "../../shared/cloudinaryConfig.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.join(__dirname, "../../media-source");
const photoSourceDirs = [
  path.join(__dirname, "../photos"),
  path.join(sourceRoot, "photos"),
];

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

const photoExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const productPhotoPattern = /^p\d+\.(?:jpe?g|png|webp)$/i;

const getPhotoPublicId = (fileName) => {
  return legacyPhotoPublicIds[fileName] || (
    productPhotoPattern.test(fileName) ? productMediaPublicId(fileName) : ""
  );
};

const readPhotoEntries = async () => {
  const filesByName = new Map();

  for (const sourceDir of photoSourceDirs) {
    let files = [];

    try {
      files = await fs.readdir(sourceDir, { withFileTypes: true });
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    for (const file of files) {
      if (!file.isFile()) continue;

      const ext = path.extname(file.name).toLowerCase();
      const publicId = getPhotoPublicId(file.name);

      if (!photoExtensions.has(ext) || !publicId) continue;
      if (file.name.startsWith("sc.") && file.name !== "sc.jpg") continue;
      if (filesByName.has(file.name)) continue;

      filesByName.set(file.name, {
        filePath: path.join(sourceDir, file.name),
        publicId,
        resourceType: "image",
      });
    }
  }

  return [...filesByName.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, entry]) => entry);
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
    invalidate: "true",
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
  form.set("invalidate", "true");
  form.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: form,
    });
  } catch (err) {
    const reason = err.cause?.code || err.message || "request failed";
    throw new Error(`Cloudinary upload failed for ${filePath}: ${reason}`);
  }

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
  const photoEntries = await readPhotoEntries();

  const videoEntries = [
    {
      filePath: path.join(sourceRoot, "video", "v2.mp4"),
      publicId: videoMediaPublicIds.homepage,
      resourceType: "video",
    },
  ];

  let failureCount = 0;

  for (const item of [...photoEntries, ...videoEntries]) {
    try {
      await fs.access(item.filePath);
      await uploadFile(item);
    } catch (err) {
      if (err.code === "ENOENT") {
        console.warn("Skipped missing", item.filePath);
        continue;
      }

      failureCount += 1;
      console.error("Failed", item.filePath, err.message);
    }
  }

  if (failureCount > 0) {
    throw new Error(`${failureCount} Cloudinary upload(s) failed`);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

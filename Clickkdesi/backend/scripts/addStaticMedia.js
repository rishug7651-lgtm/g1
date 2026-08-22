import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.resolve(scriptDir, "../../frontend/public/photos");
const [sourceArg, fileNameArg] = process.argv.slice(2);

if (!sourceArg || sourceArg === "--help" || sourceArg === "-h") {
  console.log("Usage: npm.cmd run add:media -- <source-file> [target-file-name]");
  console.log("Example: npm.cmd run add:media -- D:\\Images\\gulaabo-front.jpg p30.jpg");
  process.exit(0);
}

const source = path.resolve(sourceArg);
const targetName = path.basename(fileNameArg || source);
const extension = path.extname(targetName).toLowerCase();

if (!supportedExtensions.has(extension)) {
  throw new Error(`Unsupported image type: ${extension || "none"}. Use JPG, PNG, WebP, or AVIF.`);
}

await fs.access(source);
await fs.mkdir(mediaDir, { recursive: true });

const destination = path.join(mediaDir, targetName);
await fs.copyFile(source, destination);

console.log(`Added static media: ${destination}`);
console.log(`Use productMediaPublicId("${targetName}") in backend/config/productCatalog.js, then run npm.cmd run seed.`);

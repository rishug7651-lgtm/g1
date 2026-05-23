const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

export const siteMediaPublicIds = {
  logo: "clickkdesi/site/logo",
  categoryFullSleeves: "clickkdesi/site/category-full-sleeves",
  categorySleeveless: "clickkdesi/site/category-sleeveless",
  sizeChart: "clickkdesi/site/size-chart",
};

export const videoMediaPublicIds = {
  homepage: "clickkdesi/video/homepage",
};

export const productMediaPublicId = (name) =>
  `clickkdesi/products/${String(name).replace(/\.[^.]+$/, "")}`;

export const legacyPhotoPublicIds = {
  "/photos/c1.jpg": siteMediaPublicIds.categoryFullSleeves,
  "/photos/c2.jpg": siteMediaPublicIds.categorySleeveless,
  "/photos/logo.jpg": siteMediaPublicIds.logo,
  "/photos/sc.jpg": siteMediaPublicIds.sizeChart,
  "/photos/sc.jpeg": siteMediaPublicIds.sizeChart,
};

for (let i = 1; i <= 20; i += 1) {
  legacyPhotoPublicIds[`/photos/p${i}.jpg`] = productMediaPublicId(`p${i}.jpg`);
}

const placeholderSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#fff1f2"/><text x="450" y="600" text-anchor="middle" fill="#be123c" font-family="Arial" font-size="42">Clickkdesi</text></svg>`
);

export const imagePlaceholder = `data:image/svg+xml;charset=UTF-8,${placeholderSvg}`;

const cleanPublicId = (publicId) => String(publicId || "").replace(/^\/+|\/+$/g, "");

const buildImageTransform = ({
  transformation,
  width,
  height,
  crop = "fill",
  gravity = "auto",
  quality = "auto",
  format = "auto",
} = {}) => {
  if (transformation) return transformation;

  const parts = [];

  if (crop && (width || height)) parts.push(`c_${crop}`);
  if (gravity && crop && (width || height)) parts.push(`g_${gravity}`);
  if (width) parts.push(`w_${Math.round(Number(width))}`);
  if (height) parts.push(`h_${Math.round(Number(height))}`);
  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);

  return parts.join(",");
};

export const getCloudinaryImageUrl = (publicId, options = {}) => {
  const id = cleanPublicId(publicId);

  if (!CLOUD_NAME || !id) return "";

  const transform = buildImageTransform(options);
  const transformPath = transform ? `${transform}/` : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformPath}${id}`;
};

export const getCloudinaryVideoUrl = (
  publicId,
  { transformation = "q_auto:eco,f_auto", extension = "mp4" } = {}
) => {
  const id = cleanPublicId(publicId);

  if (!CLOUD_NAME || !id) return "";

  const source = /\.[a-z0-9]+$/i.test(id) ? id : `${id}.${extension}`;
  const transformPath = transformation ? `${transformation}/` : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformPath}${source}`;
};

export const getPublicIdFromLegacySrc = (src) => {
  if (!src) return "";

  try {
    const parsed = new URL(src, window.location.origin);
    return legacyPhotoPublicIds[parsed.pathname] || "";
  } catch {
    return legacyPhotoPublicIds[src] || "";
  }
};

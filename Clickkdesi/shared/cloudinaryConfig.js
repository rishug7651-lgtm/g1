export const DEFAULT_CLOUDINARY_CLOUD_NAME = "dje6kqbmm";

export const cloudinaryMediaFolders = {
  products: "clickkdesi/products",
  site: "clickkdesi/site",
  video: "clickkdesi/video",
};

export const PRODUCT_MEDIA_FOLDER = cloudinaryMediaFolders.products;
export const SITE_MEDIA_FOLDER = cloudinaryMediaFolders.site;
export const VIDEO_MEDIA_FOLDER = cloudinaryMediaFolders.video;

export const productMediaPublicId = (name) =>
  `${PRODUCT_MEDIA_FOLDER}/${String(name || "").replace(/\.[^.]+$/, "")}`;

export const siteMediaPublicIds = {
  logo: `${SITE_MEDIA_FOLDER}/logo`,
  categoryFullSleeves: `${SITE_MEDIA_FOLDER}/category-full-sleeves`,
  categorySleeveless: `${SITE_MEDIA_FOLDER}/category-sleeveless`,
  sizeChart: `${SITE_MEDIA_FOLDER}/size-chart`,
};

export const siteMediaCacheKeys = {
  // Bump this when replacing a same-public-id asset to break browser/CDN cache.
  sizeChart: "20260629",
};

export const videoMediaPublicIds = {
  homepage: `${VIDEO_MEDIA_FOLDER}/homepage`,
};

export const legacyPhotoPublicIds = {
  "c1.jpg": siteMediaPublicIds.categoryFullSleeves,
  "c2.jpg": siteMediaPublicIds.categorySleeveless,
  "logo.jpg": siteMediaPublicIds.logo,
  "sc.jpg": siteMediaPublicIds.sizeChart,
  "sc.jpeg": siteMediaPublicIds.sizeChart,
};

for (let i = 1; i <= 99; i += 1) {
  legacyPhotoPublicIds[`p${i}.jpg`] = productMediaPublicId(`p${i}.jpg`);
}

export const legacyPhotoPathPublicIds = Object.fromEntries(
  Object.entries(legacyPhotoPublicIds).map(([fileName, publicId]) => [
    `/photos/${fileName}`,
    publicId,
  ])
);

export const cleanCloudinaryPublicId = (publicId) =>
  String(publicId || "").replace(/^\/+|\/+$/g, "");

export const buildCloudinaryImageTransform = ({
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

export const getCloudinaryImageUrl = (cloudName, publicId, options = {}) => {
  const { cacheKey, ...transformOptions } = options;
  const cleanCloudName = cleanCloudinaryPublicId(cloudName);
  const cleanPublicId = cleanCloudinaryPublicId(publicId);

  if (!cleanCloudName || !cleanPublicId) return "";

  const transform = buildCloudinaryImageTransform(transformOptions);
  const transformPath = transform ? `${transform}/` : "";
  const cacheQuery = cacheKey ? `?v=${encodeURIComponent(cacheKey)}` : "";

  return `https://res.cloudinary.com/${cleanCloudName}/image/upload/${transformPath}${cleanPublicId}${cacheQuery}`;
};

export const getCloudinaryVideoUrl = (
  cloudName,
  publicId,
  { transformation = "q_auto:eco,f_auto", extension = "mp4" } = {}
) => {
  const cleanCloudName = cleanCloudinaryPublicId(cloudName);
  const cleanPublicId = cleanCloudinaryPublicId(publicId);

  if (!cleanCloudName || !cleanPublicId) return "";

  const source = /\.[a-z0-9]+$/i.test(cleanPublicId)
    ? cleanPublicId
    : `${cleanPublicId}.${extension}`;
  const transformPath = transformation ? `${transformation}/` : "";

  return `https://res.cloudinary.com/${cleanCloudName}/video/upload/${transformPath}${source}`;
};

const cleanPart = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

export const getCloudinaryCloudName = () =>
  process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const buildTransform = ({
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
  const cloudName = getCloudinaryCloudName();
  const cleanPublicId = cleanPart(publicId);

  if (!cloudName || !cleanPublicId) return "";

  const transform = buildTransform(options);
  const transformPath = transform ? `${transform}/` : "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformPath}${cleanPublicId}`;
};

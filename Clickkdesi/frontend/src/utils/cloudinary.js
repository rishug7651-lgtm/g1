import {
  DEFAULT_CLOUDINARY_CLOUD_NAME,
  getCloudinaryImageUrl as buildCloudinaryImageUrl,
  legacyPhotoPathPublicIds,
  productMediaPublicId,
  siteMediaCacheKeys,
  siteMediaPublicIds,
} from "@shared/cloudinaryConfig.js";

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUDINARY_CLOUD_NAME;

export {
  DEFAULT_CLOUDINARY_CLOUD_NAME,
  productMediaPublicId,
  siteMediaCacheKeys,
  siteMediaPublicIds,
};

export const legacyPhotoPublicIds = legacyPhotoPathPublicIds;

const placeholderSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#fff1f2"/><text x="450" y="600" text-anchor="middle" fill="#be123c" font-family="Arial" font-size="42">Clickkdesi</text></svg>`
);

export const imagePlaceholder = `data:image/svg+xml;charset=UTF-8,${placeholderSvg}`;

export const getCloudinaryImageUrl = (publicId, options = {}) => {
  return buildCloudinaryImageUrl(CLOUD_NAME, publicId, options);
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

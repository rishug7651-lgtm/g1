import {
  DEFAULT_CLOUDINARY_CLOUD_NAME,
  getCloudinaryImageUrl as buildCloudinaryImageUrl,
} from "../../shared/cloudinaryConfig.js";

export const getCloudinaryCloudName = () =>
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  DEFAULT_CLOUDINARY_CLOUD_NAME;

export const getCloudinaryImageUrl = (publicId, options = {}) => {
  return buildCloudinaryImageUrl(getCloudinaryCloudName(), publicId, options);
};

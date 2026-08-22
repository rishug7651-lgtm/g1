import { legacyPhotoPaths, localMediaPath, productMediaPath, siteMediaPaths } from "@shared/mediaConfig.js";

export { productMediaPath, siteMediaPaths };

const placeholderSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#fff1f2"/><text x="450" y="600" text-anchor="middle" fill="#be123c" font-family="Arial" font-size="42">Clickkdesi</text></svg>`
);

export const imagePlaceholder = `data:image/svg+xml;charset=UTF-8,${placeholderSvg}`;
export const getMediaPath = (value) => localMediaPath(value);
export const getMediaPathFromLegacySrc = (src) => {
  if (!src) return "";
  try {
    const fileName = new URL(src, window.location.origin).pathname.split("/").pop();
    return legacyPhotoPaths[fileName] || localMediaPath(src);
  } catch {
    return localMediaPath(src);
  }
};

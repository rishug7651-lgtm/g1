import { legacyPhotoPaths, localMediaPath, productMediaPath, siteMediaPaths } from "@shared/mediaConfig.js";
import { mediaVariants } from "@shared/mediaVariants.js";

export { productMediaPath, siteMediaPaths };

const placeholderSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#fff1f2"/><text x="450" y="600" text-anchor="middle" fill="#be123c" font-family="Arial" font-size="42">Clickkdesi</text></svg>`
);

export const imagePlaceholder = `data:image/svg+xml;charset=UTF-8,${placeholderSvg}`;
export const getMediaPath = (value) => localMediaPath(value);
export const getResponsiveMedia = (value, requestedWidths = []) => {
  const rawSource = String(value || "");
  if (rawSource.startsWith("data:")) return { src: rawSource };

  const source = rawSource.startsWith("/") ? rawSource : localMediaPath(rawSource);

  if (!source.startsWith("/photos/")) return { src: source };

  const fileName = source.split("/").pop();
  const variant = mediaVariants[fileName];

  if (!variant?.widths?.length) return { src: source };

  const requested = requestedWidths
    .map(Number)
    .filter((width) => Number.isFinite(width) && width > 0);
  const targets = requested.length ? requested : variant.widths;
  const availableWidths = [...new Set(
    targets.map((target) =>
      variant.widths.find((width) => width >= target) || variant.widths.at(-1)
    )
  )].sort((a, b) => a - b);
  const pathForWidth = (width) => {
    const safeName = fileName.replace(/\./g, "-");
    return `/photos/optimized/${safeName}.${variant.version}-${width}.jpg`;
  };

  return {
    src: pathForWidth(availableWidths[0]),
    srcSet: availableWidths
      .map((width) => `${pathForWidth(width)} ${width}w`)
      .join(", "),
  };
};
export const getMediaPathFromLegacySrc = (src) => {
  if (!src) return "";
  try {
    const fileName = new URL(src, window.location.origin).pathname.split("/").pop();
    return legacyPhotoPaths[fileName] || localMediaPath(src);
  } catch {
    return localMediaPath(src);
  }
};

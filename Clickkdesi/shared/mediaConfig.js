export const productMediaPath = (fileName) => `/photos/${String(fileName || "").replace(/^.*\//, "")}`;
export const PRODUCT_MEDIA_FOLDER = "/photos";
export const SITE_MEDIA_FOLDER = "/photos";
export const VIDEO_MEDIA_FOLDER = "/video";

export const siteMediaPaths = {
  logo: "/photos/logo.jpg",
  categoryFullSleeves: "/photos/c1.jpg",
  categorySleeveless: "/photos/c2.jpg",
  sizeChart: "/photos/sc.jpeg",
};

export const legacyPhotoPaths = {
  "c1.jpg": siteMediaPaths.categoryFullSleeves,
  "c2.jpg": siteMediaPaths.categorySleeveless,
  "logo.jpg": siteMediaPaths.logo,
  "sc.jpg": siteMediaPaths.sizeChart,
  "sc.jpeg": siteMediaPaths.sizeChart,
};

for (let index = 1; index <= 99; index += 1) {
  legacyPhotoPaths[`p${index}.jpg`] = productMediaPath(`p${index}.jpg`);
}

export const localMediaPath = (value) => {
  if (!value) return "";
  const source = String(value);
  if (source.startsWith("/photos/")) return source;

  try {
    const fileName = new URL(source, "https://placeholder.local").pathname.split("/").pop();
    return legacyPhotoPaths[fileName] || (fileName ? productMediaPath(fileName) : "");
  } catch {
    const fileName = source.split("/").pop();
    return legacyPhotoPaths[fileName] || (fileName ? productMediaPath(fileName) : "");
  }
};

// Transitional aliases keep existing catalog/database field names working while
// all values are now local Vercel-served paths.
export const productMediaPublicId = productMediaPath;
export const siteMediaPublicIds = siteMediaPaths;
export const legacyPhotoPublicIds = legacyPhotoPaths;
export const legacyPhotoPathPublicIds = Object.fromEntries(
  Object.entries(legacyPhotoPaths).map(([fileName, path]) => [`/photos/${fileName}`, path])
);
export const videoMediaPublicIds = {};

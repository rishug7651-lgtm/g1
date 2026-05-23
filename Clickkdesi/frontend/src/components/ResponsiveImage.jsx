import {
  getCloudinaryImageUrl,
  getPublicIdFromLegacySrc,
  imagePlaceholder,
} from "../utils/cloudinary";

const DEFAULT_WIDTHS = [320, 480, 640, 800, 960, 1200];

export default function ResponsiveImage({
  publicId,
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  width,
  height,
  crop = "fill",
  className = "",
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const resolvedPublicId = publicId || getPublicIdFromLegacySrc(src);
  const baseWidth = width || widths[Math.min(widths.length - 1, 3)];
  const optimizedSrc =
    getCloudinaryImageUrl(resolvedPublicId, {
      width: baseWidth,
      height,
      crop,
    }) ||
    src ||
    imagePlaceholder;
  const srcSet = resolvedPublicId
    ? widths
        .map((item) => {
          const url = getCloudinaryImageUrl(resolvedPublicId, {
            width: item,
            height,
            crop,
          });

          return url ? `${url} ${item}w` : "";
        })
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      alt={alt || ""}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={className}
      {...props}
    />
  );
}

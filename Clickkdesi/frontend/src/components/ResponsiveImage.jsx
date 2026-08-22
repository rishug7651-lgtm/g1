import { getMediaPath, getMediaPathFromLegacySrc, imagePlaceholder } from "../utils/media";

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
  quality = "auto:eco",
  format = "auto",
  cacheKey,
  transformation,
  className = "",
  loading = "lazy",
  decoding = "async",
  ...props
}) {
  const optimizedSrc = getMediaPath(publicId) || getMediaPathFromLegacySrc(src) || src || imagePlaceholder;

  return (
    <img
      src={optimizedSrc}
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

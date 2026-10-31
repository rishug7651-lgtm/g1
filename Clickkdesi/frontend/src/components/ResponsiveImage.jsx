import {
  getMediaPath,
  getMediaPathFromLegacySrc,
  getResponsiveMedia,
  imagePlaceholder,
} from "../utils/media";

const DEFAULT_WIDTHS = [160, 320, 640, 960];

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
  fetchPriority,
  ...props
}) {
  const optimizedSrc = getMediaPath(publicId) || getMediaPathFromLegacySrc(src) || src || imagePlaceholder;
  const responsiveMedia = getResponsiveMedia(optimizedSrc, widths);

  return (
    <img
      src={responsiveMedia.src || optimizedSrc}
      srcSet={responsiveMedia.srcSet}
      sizes={responsiveMedia.srcSet ? sizes : undefined}
      alt={alt || ""}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      {...props}
    />
  );
}

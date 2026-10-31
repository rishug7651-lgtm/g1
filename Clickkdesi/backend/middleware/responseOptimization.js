import zlib from "zlib";

const COMPRESSIBLE_CONTENT = /(application\/json|text\/|javascript|xml|svg)/i;
const MIN_COMPRESS_SIZE_BYTES = 1024;

const appendVary = (res, value) => {
  const current = res.getHeader("Vary");

  if (!current) {
    res.setHeader("Vary", value);
    return;
  }

  const values = String(current)
    .split(",")
    .map((item) => item.trim().toLowerCase());

  if (!values.includes(value.toLowerCase())) {
    res.setHeader("Vary", `${current}, ${value}`);
  }
};

const encodingQuality = (acceptEncoding, requestedEncoding) => {
  const qualities = new Map();

  for (const entry of String(acceptEncoding || "").split(",")) {
    const [name, ...parameters] = entry.trim().toLowerCase().split(";");
    if (!name) continue;

    const qualityParameter = parameters.find((parameter) =>
      parameter.trim().startsWith("q=")
    );
    const parsedQuality = qualityParameter
      ? Number(qualityParameter.trim().slice(2))
      : 1;
    qualities.set(name, Number.isFinite(parsedQuality)
      ? Math.max(0, Math.min(parsedQuality, 1))
      : 0);
  }

  if (qualities.has(requestedEncoding)) {
    return qualities.get(requestedEncoding);
  }

  return qualities.get("*") || 0;
};

export const compressionMiddleware = (req, res, next) => {
  const send = res.send.bind(res);

  res.send = (body) => {
    if (
      req.method === "HEAD" ||
      res.statusCode < 200 ||
      res.statusCode === 204 ||
      res.statusCode === 304 ||
      res.getHeader("Content-Encoding")
    ) {
      return send(body);
    }

    const acceptEncoding = req.headers["accept-encoding"] || "";
    const brotliQuality = encodingQuality(acceptEncoding, "br");
    const gzipQuality = encodingQuality(acceptEncoding, "gzip");
    const encoding = brotliQuality > 0 && brotliQuality >= gzipQuality
      ? "br"
      : gzipQuality > 0
        ? "gzip"
        : "";

    if (!encoding) {
      return send(body);
    }

    const contentType = String(res.getHeader("Content-Type") || "");

    if (!COMPRESSIBLE_CONTENT.test(contentType)) {
      return send(body);
    }

    const payload = Buffer.isBuffer(body)
      ? body
      : typeof body === "string"
        ? Buffer.from(body)
        : null;

    if (!payload || payload.length < MIN_COMPRESS_SIZE_BYTES) {
      return send(body);
    }

    try {
      const compressed =
        encoding === "br"
          ? zlib.brotliCompressSync(payload, {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
              },
            })
          : zlib.gzipSync(payload, { level: 6 });

      res.setHeader("Content-Encoding", encoding);
      res.setHeader("Content-Length", compressed.length);
      appendVary(res, "Accept-Encoding");

      return send(compressed);
    } catch {
      return send(body);
    }
  };

  next();
};

export const publicCache = (seconds, { staleWhileRevalidate = 60 } = {}) => {
  const parts = [`public`, `max-age=${seconds}`];

  if (staleWhileRevalidate) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  return (req, res, next) => {
    res.setHeader("Cache-Control", parts.join(", "));
    next();
  };
};

export const noStore = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

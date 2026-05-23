const buckets = new Map();

const getClientKey = (req) => {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();

  return forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";
};

const cleanupBuckets = (now) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const rateLimit = ({
  windowMs = 60 * 1000,
  max = 120,
  keyPrefix = "global",
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();

    if (buckets.size > 2000) {
      cleanupBuckets(now);
    }

    const key = `${keyPrefix}:${getClientKey(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({ message });
    }

    return next();
  };
};

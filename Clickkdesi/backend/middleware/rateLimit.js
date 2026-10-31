const buckets = new Map();
const CLEANUP_THRESHOLD = 2000;
let nextCleanupAt = 0;

const getClientKey = (req) => {
  // Express resolves req.ip using the configured trusted proxy chain. Reading
  // X-Forwarded-For directly lets clients spoof their key and bypass limits.
  return req.ip || req.socket?.remoteAddress || "unknown";
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
  const normalizedWindowMs = Number.isFinite(Number(windowMs))
    ? Math.max(1000, Math.floor(Number(windowMs)))
    : 60 * 1000;
  const normalizedMax = Number.isFinite(Number(max))
    ? Math.max(1, Math.floor(Number(max)))
    : 120;

  return (req, res, next) => {
    const now = Date.now();

    if (buckets.size > CLEANUP_THRESHOLD && now >= nextCleanupAt) {
      cleanupBuckets(now);
      nextCleanupAt = now + normalizedWindowMs;
    }

    const key = `${keyPrefix}:${getClientKey(req)}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 1,
        resetAt: now + normalizedWindowMs,
      };
      buckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(normalizedMax - bucket.count, 0);
    const resetAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", normalizedMax);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetAfterSeconds);

    if (bucket.count > normalizedMax) {
      res.setHeader("Retry-After", resetAfterSeconds);
      return res.status(429).json({ message });
    }

    return next();
  };
};

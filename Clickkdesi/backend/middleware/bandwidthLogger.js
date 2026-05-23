const MIN_LOG_BYTES = Number(process.env.HTTP_BANDWIDTH_LOG_MIN_BYTES || 100 * 1024);
const LOG_ALL = process.env.HTTP_BANDWIDTH_LOG_ALL === "true";

export const bandwidthLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const contentLength = Number(res.getHeader("Content-Length") || 0);

    if (!LOG_ALL && contentLength < MIN_LOG_BYTES) return;

    console.log(
      "HTTP_BANDWIDTH",
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        bytes: contentLength,
        ms: Date.now() - startedAt,
      })
    );
  });

  next();
};

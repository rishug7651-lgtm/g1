export const requireAdminToken = (req, res, next) => {
  const token = process.env.ADMIN_API_TOKEN;

  if (!token) {
    return res.status(404).json({ message: "Not found" });
  }

  const authHeader = String(req.headers.authorization || "");
  const suppliedToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (suppliedToken !== token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

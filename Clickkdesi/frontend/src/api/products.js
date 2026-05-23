import API from "./axios";

const CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map();

const normalizeProductsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      products: payload,
      pagination: {
        page: 1,
        limit: payload.length,
        total: payload.length,
        totalPages: 1,
      },
    };
  }

  return {
    products: payload?.products || [],
    pagination: payload?.pagination || {
      page: 1,
      limit: payload?.products?.length || 0,
      total: payload?.products?.length || 0,
      totalPages: 1,
    },
  };
};

const getCacheKey = (params) => `products:${JSON.stringify(params)}`;

const readSessionCache = (key) => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || "null");

    if (!cached || cached.expiresAt < Date.now()) {
      sessionStorage.removeItem(key);
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
};

const writeSessionCache = (key, value) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: Date.now() + CACHE_TTL_MS,
        value,
      })
    );
  } catch {
    // Browsers can deny storage in private modes. Network fetch still works.
  }
};

export const getProducts = async ({
  category,
  page = 1,
  limit = 24,
} = {}) => {
  const params = {
    page,
    limit,
    ...(category ? { category } : {}),
  };
  const cacheKey = getCacheKey(params);
  const cached = memoryCache.get(cacheKey) || readSessionCache(cacheKey);

  if (cached) {
    memoryCache.set(cacheKey, cached);
    return cached;
  }

  const res = await API.get("/products", { params });
  const value = normalizeProductsPayload(res.data);

  memoryCache.set(cacheKey, value);
  writeSessionCache(cacheKey, value);

  return value;
};

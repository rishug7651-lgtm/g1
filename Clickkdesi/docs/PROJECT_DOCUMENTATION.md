# Clickkdesi project documentation

**Documentation date:** 2026-11-01  
**Scope:** This describes the repository implementation and the Render Blueprint in the current working tree. Render dashboard settings, production secrets, database contents, and third-party account settings are external to this repository and are not asserted here.

## 1. Project overview

Clickkdesi is a fashion ecommerce storefront. Customers can browse and filter products, view product details, add sizes and quantities to a cart, submit shipping details, and pay through Razorpay. The backend stores products and orders in MongoDB. Successful payments trigger invoice generation, optional email confirmation, and Google Sheets order synchronization.

### Current source configuration

| Area | Configuration |
|---|---|
| GitHub remote used for the G1 deployment | rishug7651-lgtm/g1, branch main |
| Public storefront URL | https://clickkdesistore.in |
| Backend URL configured in Render and frontend source | https://g1-x5ol.onrender.com |
| Frontend hosting | Render static site declared in render.yaml |
| Backend hosting | Render Node web service declared in render.yaml |
| Database | MongoDB accessed through Mongoose |

The Render Blueprint declares services named clickkdesi-frontend and clickkdesi-backend. Whether each service deploys automatically on every push is controlled by the Render dashboard configuration.

## 2. Main features

- Home page with hero carousel, categories, and an eight-product trending section.
- Product listing with optional category filter and a 24-item page request.
- Product details with responsive front/back images, size-chart image, add-to-cart, and share actions.
- Cart state with product and size grouping, quantity updates, removal, and clearing.
- Checkout with customer contact and shipping details, free delivery, and the SUPER50 coupon.
- Razorpay payment initialization, client checkout, signature verification, and webhook fulfillment.
- Admin order list protected by a bearer token.
- Health endpoint, API rate limits, response compression, cache validators, and image variants.
- Order invoice PDF, EmailJS confirmation, and Google Sheets order export with background retry.

There is no customer account or login flow in the routed frontend. The cart is held in React memory and is cleared after successful client-side payment verification.

## 3. Technology and repository layout

### Technology

- Frontend: React 19, Vite 7, React Router, Axios, Tailwind CSS, Framer Motion, Swiper, AOS.
- Backend: Node.js, Express 5, Mongoose 9.
- Persistence: MongoDB.
- Payments: Razorpay.
- Order integrations: Google Sheets API and EmailJS.
- Static site and API deployment definition: Render Blueprint in render.yaml.

### Important paths

| Path | Responsibility |
|---|---|
| Clickkdesi/frontend/src/main.jsx | React entry point, global styles, cart provider, animation initialization |
| Clickkdesi/frontend/src/App.jsx | Client routes and lazy-loaded page components |
| Clickkdesi/frontend/src/api/axios.js | API base URL selection and Axios timeout |
| Clickkdesi/frontend/src/api/products.js | Product client cache and product-list API call |
| Clickkdesi/frontend/src/context/CartContext.jsx | In-memory cart state |
| Clickkdesi/frontend/src/pages | Home, products, details, cart, checkout, payment, success, and orders pages |
| Clickkdesi/frontend/src/components/ResponsiveImage.jsx | Responsive image source and loading behavior |
| Clickkdesi/shared/mediaConfig.js | Local media paths and legacy filename mapping |
| Clickkdesi/shared/mediaVariants.js | Generated responsive image variant manifest |
| Clickkdesi/backend/server.js | Express app, middleware ordering, mounted routes, health checks, and server start |
| Clickkdesi/backend/routes | Active product, order, payment, and share route handlers |
| Clickkdesi/backend/models | Mongoose Product and Order schemas |
| Clickkdesi/backend/services/orderFulfillment.js | Paid-order side effects and in-process fulfillment lock |
| Clickkdesi/backend/utils/sheetSync.js | Claiming, retrying, and recording Google Sheets sync |
| Clickkdesi/backend/utils/googleSheet.js | Google credentials, spreadsheet access, row mapping, and write/update |
| Clickkdesi/backend/utils/sendEmail.js | EmailJS payload generation and outbound email |
| Clickkdesi/backend/middleware/rateLimit.js | Per-IP, in-memory fixed-window rate limiter |
| Clickkdesi/backend/middleware/responseOptimization.js | Compression, cache headers, and basic security headers |
| Clickkdesi/scripts/optimize-images.ps1 | Creates width-specific JPEGs and updates the media manifest |
| render.yaml | Backend and static frontend services, build settings, environment names, routes, and cache headers |

The root repository is not itself an npm application. Install and run frontend and backend dependencies in their respective directories.

## 4. System design

The diagrams and numbered runtime flows are in [SYSTEM_FLOWCHARTS.md](SYSTEM_FLOWCHARTS.md). At a high level:

1. A browser downloads the Render-hosted Vite static app and local static images.
2. React Router loads the page component needed for the current URL.
3. The frontend API module calls the configured backend URL.
4. Express applies CORS, security headers, compression, then the route-specific limiter.
5. Routes validate input and read/write MongoDB through Mongoose.
6. Public product data returns to the storefront; payment and order operations can call Razorpay, Google Sheets, and EmailJS.
7. The frontend renders product results or checkout state.

The frontend and API are separate origins. The API must list the storefront origin in CORS_ORIGINS for browsers to read API responses.

## 5. Customer and application flows

### Product discovery

- Home calls getProducts with limit 8.
- The products page calls getProducts with limit 24 and an optional category query.
- The detail page requests one product by MongoDB ID.
- Product list and detail requests use the configured API base URL; the production source fallback is https://g1-x5ol.onrender.com/api.
- Product images are mapped to local /photos paths and responsive variants where a manifest entry exists.
- If the product API request fails, the home page logs the error and remains in its loading/empty state; the current home component does not render an explicit request-error message.

### Cart and checkout

- Cart entries are merged when both product ID and size match.
- Size choices accepted by the order API are default, XS, S, M, L, XL, 2XL, and 3XL.
- The checkout page requires name, email, Indian mobile number, address, and six-digit pincode.
- The server repeats validation and fetches product names and prices from MongoDB. It does not trust item prices sent by the browser.
- The only active coupon in both frontend and backend is SUPER50. It applies a fixed ₹30 discount, capped at the subtotal.
- The backend creates the order with paymentStatus pending, then Razorpay order creation happens in a separate request.

### Payment and fulfillment

- The payment page asks the backend to create a Razorpay order for the existing pending order.
- Razorpay Checkout is loaded from Razorpay only when the customer proceeds to pay.
- After client checkout, the browser posts Razorpay IDs, signature, and the application order ID to /api/payment/verify.
- The backend verifies the HMAC signature and confirms that the Razorpay order ID matches the stored order.
- Razorpay payment.captured webhook events can also complete the same order.
- A successful payment changes paymentStatus to paid and orderStatus to confirmed.
- Fulfillment attempts invoice generation, Sheets synchronization, and confirmation email. These are logged as separate side effects; invoice or email failure does not reverse a captured payment.
- Successful verification clears the browser cart and shows a success page that returns to the home page after four seconds.

### Order management

- The frontend Orders page prompts for the admin API token and keeps it in sessionStorage for the current browser tab session.
- The page requests the first 20 orders using Authorization: Bearer.
- The backend order list endpoint is protected by ADMIN_API_TOKEN.
- The order-by-ID endpoint is public but returns a restricted selection of order fields.
- The schema supports processing, confirmed, shipped, delivered, and cancelled order statuses. The current active API routes do not provide an order-status update endpoint.

## 6. HTTP API reference

Base URL: the configured backend origin, followed by /api for API routes.

| Method and path | Access | Purpose and behavior |
|---|---|---|
| GET / | Public | Simple “Backend Running” response. |
| GET /healthz | Public | Health and deployment marker, Git commit if supplied by Render, and boolean/configuration status for Sheets and email. |
| GET /api/products?page=1&limit=12&category=Sleeveless | Public | Product list; defaults to page 1, limit 12, maximum limit 48. Category match is case-insensitive. Returns products and pagination. |
| GET /api/products/:id | Public | One product by MongoDB ID; returns 404 when absent. |
| GET /api/products/share/:id | Public | Product share HTML with Open Graph/Twitter metadata and frontend redirect. |
| GET /product/:id | Public | Share HTML for a product and frontend redirect; used by the frontend share URL. |
| GET /photos/:filename | Public | Legacy photo route that redirects to the mapped frontend media path. |
| POST /api/orders | Public | Validates cart and shipping details, re-reads trusted products/prices, applies coupon, and creates a pending MongoDB order. Request body contains products and shippingAddress. Response contains success and orderId. |
| GET /api/orders?page=1&limit=20 | Admin bearer token | Lists recent orders and pagination. Maximum limit is 50. |
| GET /api/orders/:id | Public | Returns the selected order summary fields; no full shipping address. |
| POST /api/payment/create-order | Public | Body: orderId. Requires an existing pending order with a positive total; creates the Razorpay order and saves its ID. |
| POST /api/payment/verify | Public payment callback | Verifies Razorpay signature and stored order linkage, then fulfills the paid order. |
| POST /api/payment/razorpay-webhook | Razorpay webhook | Verifies webhook HMAC; handles payment.captured and payment.failed events. |
| POST /api/payment/payment-failed | Public | Marks a matching not-yet-paid order failed. |
| GET /test-sheet | Admin bearer token | Sends a synthetic test order to the configured Sheet1 spreadsheet. |

### Product list response shape

The list route returns an object containing products and pagination. List projections omit description to reduce response size. Product details include description.

### Order creation request shape

The browser sends products with productId, name, price, quantity, and size, plus shippingAddress. The backend uses only product IDs, quantities, and size for trusted item construction, validates shipping details, and computes the total from database prices. The accepted coupon is applied server-side.

### Rate-limit response

Over-limit requests receive HTTP 429 JSON with a message and the RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, and Retry-After headers.

## 7. Data model

### Product

- name, price, mrp, image, hoverImage, imagePublicId, hoverImagePublicId, imageAlt, description, category.
- createdAt and updatedAt timestamps.
- Indexes on category plus createdAt and _id for list ordering, and on updatedAt.
- There is no stock/inventory quantity field in the current schema.

### Order

- products: product ID, trusted name and price snapshot, quantity, and size.
- shippingAddress: name, email, phone, address, optional city, and pincode.
- totalAmount and couponCode.
- paymentStatus: pending, paid, or failed.
- orderStatus: processing, confirmed, shipped, delivered, or cancelled.
- Razorpay order/payment IDs and paidAt.
- invoiceUrl and Sheets/email fulfillment flags/timestamps.
- createdAt and updatedAt timestamps.
- Indexes on createdAt, razorpayOrderId, and fields used to find paid orders pending Sheets sync.

The coupon is a fixed amount, not a percentage. SUPER50 currently subtracts ₹30, up to the subtotal.

## 8. Performance and bandwidth behavior

| Technique | Current implementation |
|---|---|
| Route code splitting | App.jsx lazy-loads each routed page. |
| Product list sizing | Home requests 8 items; listing requests 24; backend caps a single response at 48. |
| Client product cache | products.js keeps product responses in a module Map and sessionStorage for five minutes. |
| Backend product cache | Product list cache defaults to 300 seconds; detail cache defaults to 600 seconds. Both are process memory caches. |
| Conditional responses | Cached product JSON has an ETag and supports If-None-Match/304. Cache-Control includes stale-while-revalidate. |
| Database projection | Product list omits descriptions; route uses lean reads and only selected fields. |
| API compression | Backend chooses Brotli or gzip for compressible responses of at least 1024 bytes when accepted by the client. |
| Responsive JPEGs | The image script produces JPEG variants at source-supported widths from 160, 320, 640, and 960 pixels, at quality 72, and versions them with a SHA-256-derived filename. |
| Responsive image selection | ResponsiveImage uses srcSet/sizes when a manifest entry exists, defaults to lazy loading and async decoding, and can request eager loading for the main detail image. |
| Static asset caching | Render Blueprint declares one-year immutable caching for /assets/* and /photos/optimized/*, and a five-minute cache for other static paths. |
| Write-response caching | Order/payment writes and admin order reads use Cache-Control: no-store. |

The client and backend caches are instance-local. They improve repeat requests but do not share state between browser tabs, backend processes, or Render instances.

## 9. Security and operational boundaries

- CORS origins are configured in CORS_ORIGINS and normalized before comparison. Current defaults include localhost development and the storefront domains. Set the Render environment value to the exact allowed production origins.
- Express trusts one proxy hop and rate-limit keys use req.ip rather than directly reading an untrusted X-Forwarded-For header.
- The admin order list and test-sheet route require an Authorization Bearer token. Keep ADMIN_API_TOKEN private.
- Payment verification uses HMAC SHA-256 and timing-safe comparison for the hex signature.
- Order totals and product prices are recomputed from MongoDB on the server.
- Request JSON is capped at 64kb by default; JSON_BODY_LIMIT can override it.
- Security response headers include nosniff, strict-origin-when-cross-origin referrer policy, frame denial, and a permissions policy disabling camera, microphone, and geolocation.
- Environment files are ignored by the root .gitignore; only .env.example files should be committed. No production credential values belong in documentation or source control.
- The API rate limiter is a fixed-window Map in one Node process. Counters reset when the process restarts and are not shared between instances. For horizontally scaled enforcement, replace or back it with shared storage such as Redis.
- The fulfillment lock is also process-local. Google Sheets synchronization adds a MongoDB claim to reduce duplicate retries across processes.
- The customer order lookup route is public and only returns its selected summary fields. The active UI does not implement customer identity verification.
- Admin token input is kept in sessionStorage by the Orders page; clear the browser tab session after administering orders.

## 10. Configuration reference

Set secret values in local ignored .env files or the hosting provider’s secret environment settings. The table lists names and purposes, not values.

### Backend configuration

| Name | Purpose/default |
|---|---|
| PORT | HTTP port; local fallback is 5000. Render supplies the deployed port. |
| NODE_ENV | Render Blueprint sets production. |
| MONGO_URI | Required MongoDB connection URI. |
| PUBLIC_BACKEND_URL | Public backend origin for canonical/share links; Blueprint uses the G1 backend URL. |
| PUBLIC_FRONTEND_URL | Public storefront origin for redirects/share metadata; Blueprint uses the Clickkdesi domain. |
| CORS_ORIGINS | Comma-separated browser origins allowed by the API. |
| JSON_BODY_LIMIT | JSON request size limit; default 64kb. |
| API_RATE_LIMIT_PER_MINUTE | Product and order group limit; default 180 per IP per minute. |
| PAYMENT_RATE_LIMIT_PER_MINUTE | Payment group limit; default 40 per IP per minute. |
| SHARE_RATE_LIMIT_PER_MINUTE | Share route limit; default 60 per IP per minute. |
| PHOTO_RATE_LIMIT_PER_MINUTE | Legacy photo redirect limit; default 240 per IP per minute. |
| PRODUCT_LIST_TTL_SECONDS | Product list response cache; default 300 seconds. |
| PRODUCT_DETAIL_TTL_SECONDS | Product detail response cache; default 600 seconds. |
| RAZORPAY_KEY | Server Razorpay key ID; the matching VITE_RAZORPAY_KEY is used by the browser checkout. |
| RAZORPAY_SECRET | Private signing/order API secret; server only. |
| RAZORPAY_WEBHOOK_SECRET | Secret for authenticating webhook requests. |
| ADMIN_API_TOKEN | Bearer token for admin order list and sheet test route. |
| EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY | EmailJS service/template/public key. Missing config causes confirmation email to be skipped. |
| EMAILJS_PRIVATE_KEY | Optional EmailJS private/access token. |
| EMAILJS_FROM_EMAIL, EMAILJS_FROM_NAME, EMAILJS_CC_EMAIL, ADMIN_EMAIL | Sender and optional admin-copy addresses. |
| GOOGLE_SHEET_ID | Spreadsheet ID. |
| GOOGLE_SERVICE_ACCOUNT_FILE | Credential file path; Render Blueprint sets /etc/secrets/google.json. |
| GOOGLE_APPLICATION_CREDENTIALS | Alternative credential-file path. |
| GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 | Alternative base64-encoded credential JSON. |
| GOOGLE_SERVICE_ACCOUNT_JSON | Alternative raw credential JSON. |
| GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID | Alternative split credentials/project setting. |
| SHEET_RETRY_ENABLED | Retry worker enablement; enabled unless set to false. |
| SHEET_RETRY_SCHEDULE | Cron schedule; default every 15 minutes. |
| SHEET_RETRY_BATCH_SIZE | Number of pending orders processed per retry batch; default 10. |
| SHEET_SYNC_LIMIT, SHEET_SYNC_ATTEMPTS, SHEET_SYNC_RETRY_DELAY_MS | Limits and retry controls for manual sync scripts. |
| RENDER_GIT_COMMIT | Supplied by Render and exposed on /healthz when present. |

The preferred Render Google credential method is a Secret File mounted at /etc/secrets/google.json. The existing setup guide is backend/GOOGLE_SHEETS_RENDER_SETUP.md. Keep credentials out of Git.

### Frontend build configuration

| Name | Purpose |
|---|---|
| VITE_API_BASE_URL | API base URL compiled into the frontend; Render Blueprint points to the G1 API /api path. |
| VITE_PUBLIC_BACKEND_URL | Backend origin used for product sharing. |
| VITE_RAZORPAY_KEY | Browser-visible Razorpay checkout key ID; this is not the private Razorpay secret. |
| VITE_CLOUDINARY_CLOUD_NAME | Present in the sample/Render configuration but not referenced by the current local media path implementation. |

Vite embeds VITE_* values at build time. Changing a frontend environment value requires a new frontend build/deployment.

## 11. Local development and maintenance

### Start the frontend

From Clickkdesi/frontend:

1. Install with npm ci.
2. Copy .env.example to .env only when local overrides are needed.
3. Run npm run dev.
4. The local frontend default API in axios.js is http://localhost:5000/api when Vite is in development mode and VITE_API_BASE_URL is unset.

### Start the backend

From Clickkdesi/backend:

1. Install with npm ci.
2. Configure .env using .env.example; at minimum provide MONGO_URI.
3. Run npm run dev for nodemon or npm start for a normal Node process.

### Build and lint the frontend

From Clickkdesi/frontend:

- npm run build writes the production site to dist.
- npm run lint runs ESLint.
- npm run preview serves the built site locally.

PowerShell users can run these with npm.cmd where script execution policy blocks npm.ps1.

### Product and image maintenance

- Product schema: backend/models/Product.js.
- Seed data: backend/config/productCatalog.js; seed command is npm run seed from backend. Review it before using against any production database.
- Product image files: frontend/public/photos.
- Regenerate responsive variants from the repository root with powershell -ExecutionPolicy Bypass -File .\Clickkdesi\scripts\optimize-images.ps1.
- The optimizer updates shared/mediaVariants.js and writes JPEG variants under frontend/public/photos/optimized.

### Google Sheets maintenance

From backend, available commands are npm run verify:sheet, npm run sync:pending-sheets, and npm run resync:sheets. Review the Google Sheets setup guide before changing credentials or running a resync.

## 12. Current implementation notes

- The active API logic is in route modules. Some older controller modules, including controllers/orderController.js and controllers/paymentWebhook.js, are not mounted by server.js; use the mounted route files as the API source of truth.
- The backend rate limiter, product response cache, and fulfillment deduplication lock are process-local.
- Client cart state is not persisted across a page reload.
- There is no inventory reservation/stock decrement path in the current Product schema or order creation flow.
- Order status values beyond confirmed are represented in the schema, but this repository has no active endpoint to move orders through shipping/delivery.
- The generated invoice is used by the fulfillment flow as an email attachment. The current Express routes do not expose an invoice download route.
- Only one fixed coupon is enabled in both frontend and backend; change both definitions together if coupon behavior changes.
- This document describes source configuration. Confirm Render environment values, deployments, MongoDB data, Razorpay webhooks, and Google/EmailJS configuration in their own dashboards before relying on their live state.

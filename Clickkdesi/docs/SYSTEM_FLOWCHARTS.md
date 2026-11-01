# Clickkdesi system design and flowcharts

These diagrams describe the current source flow. They are split by system concern so each flow can be read on its own.

## 1. Overall system architecture

~~~mermaid
flowchart LR
  Customer[Customer browser]
  Admin[Admin browser]
  GitHub[GitHub repository<br/>rishug7651-lgtm/g1]
  Static[Render static frontend<br/>React + Vite]
  API[Render Node service<br/>Express API]
  Mongo[(MongoDB)]
  Razorpay[Razorpay]
  Sheets[Google Sheets API]
  Email[EmailJS]
  Photos[Static photos<br/>optimized JPEG variants]
  Invoice[Invoice PDF<br/>backend filesystem]

  GitHub -->|configured branch build| Static
  GitHub -->|configured branch build| API
  Customer -->|HTTPS page/assets| Static
  Customer -->|HTTPS images| Photos
  Customer -->|Axios JSON / CORS| API
  Admin -->|Bearer token for order list| API
  Static -->|product, order, payment requests| API
  API -->|Mongoose reads/writes| Mongo
  API -->|create order, verify/payment events| Razorpay
  Razorpay -->|webhook callback| API
  API -->|paid order row| Sheets
  API -->|invoice/order email| Email
  API -->|create PDF| Invoice
~~~

## 2. Categorized request processing design

### 2.1 Browser and routing layer

1. Browser downloads the static HTML, JavaScript, CSS, and images from the frontend host.
2. The React entry point mounts CartProvider and BrowserRouter.
3. App.jsx matches the URL to a route and lazy-loads its page module.
4. Product pages call the product API module; checkout and payment pages use the shared Axios instance.
5. Product images render as local photo URLs and choose the closest generated width through srcSet and sizes.

### 2.2 API ingress and middleware layer

~~~mermaid
flowchart TD
  Req[Incoming HTTP request]
  CORS[CORS origin allowlist]
  Security[Security headers]
  Compression[Accept-Encoding compression wrapper]
  Route{Route group}
  ApiLimit[API limiter<br/>products and orders]
  PayLimit[Payment limiter]
  ShareLimit[Share limiter]
  PhotoLimit[Legacy photo limiter]
  Handler[Route validation and handler]
  DB[(MongoDB)]
  Ext[Third-party service]
  Resp[JSON, HTML, redirect, or 404]
  DeniedCORS[CORS error response]
  Limited[429 + Retry-After]

  Req --> CORS
  CORS -->|origin allowed or absent| Security
  CORS -->|origin rejected| DeniedCORS
  Security --> Compression --> Route
  Route -->|/api/products or /api/orders| ApiLimit
  Route -->|/api/payment/*| PayLimit
  Route -->|/product/*| ShareLimit
  Route -->|/photos/* legacy redirect| PhotoLimit
  ApiLimit -->|under limit| Handler
  PayLimit -->|under limit| Handler
  ShareLimit -->|under limit| Handler
  PhotoLimit -->|under limit| Handler
  ApiLimit -->|over limit| Limited
  PayLimit -->|over limit| Limited
  ShareLimit -->|over limit| Limited
  PhotoLimit -->|over limit| Limited
  Handler --> DB
  Handler --> Ext
  Handler --> Resp
~~~

Current limits are fixed-window, per-process, per-IP buckets. Defaults are 180 requests/minute for products and orders, 40/minute for payment, 60/minute for share pages, and 240/minute for legacy photo redirects. The corresponding *_RATE_LIMIT_PER_MINUTE variables override each default.

### 2.3 Data and integration layer

1. Product reads use selected projections and lean Mongoose queries.
2. Order creation resolves product IDs against MongoDB and snapshots trusted names/prices.
3. Payment operations communicate with Razorpay and persist payment/order identifiers.
4. Paid-order fulfillment updates MongoDB first.
5. Invoice, Sheets, and email operations follow; integration failures are logged and do not unmark a captured payment.
6. A scheduled worker searches paid orders not yet recorded in Sheets and retries them.

## 3. Product browsing and image delivery

~~~mermaid
flowchart TD
  Open[Open home or products page]
  Lazy[React lazy-loads route page]
  Params[Build page, limit, optional category]
  ClientCache{Memory or session cache<br/>valid for 5 minutes?}
  API[GET /api/products]
  CORS[CORS + API limiter]
  ServerCache{Backend product cache<br/>key: category/page/limit}
  ETag{If-None-Match matches?}
  Mongo[(Query MongoDB<br/>project fields, sort, paginate)]
  JSON[JSON products + pagination<br/>ETag, Cache-Control]
  Render[Render product cards]
  Media[Choose local image variant<br/>srcSet + sizes]
  Static[Fetch optimized static JPEG]
  Empty[Log API error or show empty/loading state]

  Open --> Lazy --> Params --> ClientCache
  ClientCache -->|hit| Render
  ClientCache -->|miss| API --> CORS --> ServerCache
  ServerCache -->|valid cached entry| ETag
  ServerCache -->|miss/expired| Mongo --> JSON
  ETag -->|yes| ClientCache
  ETag -->|no| JSON
  JSON --> ClientCache --> Render
  API -->|network/CORS/server error| Empty
  Render --> Media --> Static
~~~

### Product-list details

1. Home requests 8 records; the products page requests 24.
2. Backend clamps page to at least 1 and limit to 1–48; missing values default to page 1 and limit 12.
3. An optional category becomes a case-insensitive exact category match.
4. Query returns name, prices, images, alt text, category, and updatedAt; description is only requested for detail pages.
5. Backend returns products plus page, limit, total, and totalPages.
6. The client maps to cards; responsive image selection uses the shared media variant manifest.

## 4. Cart, checkout, and payment flow

~~~mermaid
flowchart TD
  Browse[Browse products]
  Add[Add product with selected size]
  Cart[CartContext in-memory cart]
  Checkout[Enter shipping details and optional coupon]
  ClientValidate{Frontend validation passes?}
  CreateOrder[POST /api/orders]
  Validate[Server validates fields, sizes, quantity]
  Trusted[Load current names and prices from MongoDB]
  Coupon{Coupon valid?}
  Pending[Save order<br/>paymentStatus=pending]
  Init[POST /api/payment/create-order]
  CheckPending{Order exists, pending,<br/>valid amount?}
  RazorCreate[Create Razorpay order]
  SaveRazor[Save Razorpay order ID]
  Script[Load Razorpay Checkout script on demand]
  Pay[Customer completes or dismisses checkout]
  ClientVerify[POST /api/payment/verify]
  Signature{HMAC valid and order IDs match?}
  Fail[Mark payment failed or leave pending<br/>show error/retry]
  Webhook[POST Razorpay webhook]
  WebhookVerify{Webhook signature valid?}
  Captured{payment.captured?}
  Fulfill[Shared paid-order fulfillment]
  Clear[Clear cart after successful browser verification]
  Success[Show success page<br/>redirect home after 4 seconds]
  Dismiss[Dismiss checkout<br/>return to checkout]

  Browse --> Add --> Cart --> Checkout --> ClientValidate
  ClientValidate -->|no| Checkout
  ClientValidate -->|yes| CreateOrder --> Validate
  Validate -->|invalid| Fail
  Validate -->|valid| Trusted --> Coupon
  Coupon -->|invalid| Fail
  Coupon -->|valid or absent| Pending --> Init --> CheckPending
  CheckPending -->|no| Fail
  CheckPending -->|yes| RazorCreate --> SaveRazor --> Script --> Pay
  Pay -->|paid callback| ClientVerify --> Signature
  Signature -->|no| Fail
  Signature -->|yes| Fulfill --> Clear --> Success
  Pay -->|dismissed| Dismiss --> Checkout
  Pay -->|Razorpay callback/webhook| Webhook --> WebhookVerify
  WebhookVerify -->|invalid| Fail
  WebhookVerify -->|valid| Captured
  Captured -->|yes| Fulfill
  Captured -->|payment.failed| Fail
~~~

### Validation and pricing checkpoints

1. Frontend checks required name, email, Indian mobile number, non-empty address, and six-digit pincode.
2. Backend independently checks these values, accepts only declared sizes, and bounds each item quantity to 1–20.
3. Backend rejects invalid MongoDB product IDs and missing products.
4. Backend uses database price, not browser price.
5. SUPER50 currently means a fixed ₹30 discount, capped at the subtotal; frontend and backend definitions must stay aligned.
6. Pending order persistence happens before the separate Razorpay order creation step.
7. Client verification checks signature and confirms the Razorpay order ID belongs to the MongoDB order.
8. Webhook capture can complete the order even if the browser callback is not received.

## 5. Paid-order fulfillment and retry

~~~mermaid
flowchart TD
  Start[Verified payment or valid capture webhook]
  Find[Find order by internal ID or Razorpay order ID]
  Exists{Order found?}
  Lock{Fulfillment already running<br/>in this process?}
  Mark[Set paymentStatus=paid<br/>orderStatus=confirmed<br/>save payment IDs/time]
  Invoice[Generate invoice PDF]
  InvoiceOK{Invoice created?}
  SheetDone{sheetSaved already true?}
  Claim[Atomically claim Sheets sync in MongoDB]
  SheetWrite[Find existing row by order ID;<br/>update or append A:L]
  SheetRetry[Retry up to 3 times<br/>with 2 second delay]
  Email[Send EmailJS customer confirmation<br/>with invoice attachment]
  Done[Finish side effects; keep payment paid]
  Cron[Every 15 minutes by default]
  FindPending[Find paid orders with payment ID<br/>and sheetSaved not true]
  Batch[Process configured batch<br/>default 10]
  Result[Persist claim/result and log outcome]

  Start --> Find --> Exists
  Exists -->|no| Done
  Exists -->|yes| Lock
  Lock -->|active task| Done
  Lock -->|free| Mark --> Invoice --> InvoiceOK
  InvoiceOK -->|yes| SheetDone
  InvoiceOK -->|no| SheetDone
  SheetDone -->|yes| Email
  SheetDone -->|no| Claim --> SheetWrite
  SheetWrite -->|success| Email
  SheetWrite -->|failure| SheetRetry
  SheetRetry --> Result --> Email
  Email --> Done
  Cron --> FindPending --> Batch --> Claim
~~~

Invoice, email, and Sheets are secondary side effects after payment capture. Their failure must not be interpreted as payment failure. Sheets retry is enabled unless SHEET_RETRY_ENABLED=false. The scheduled batch size defaults to 10. Manual commands and credential setup are documented in backend/GOOGLE_SHEETS_RENDER_SETUP.md.

## 6. Order status flow

~~~mermaid
stateDiagram-v2
  [*] --> processing: Order created / pending payment
  processing --> confirmed: Payment verified or captured
  processing --> processing: Payment pending
  processing --> processing: Payment failed (paymentStatus becomes failed)
  confirmed --> shipped: Supported schema value; no active update route
  shipped --> delivered: Supported schema value; no active update route
  confirmed --> cancelled: Supported schema value; no active update route
~~~

Payment state and order state are separate fields. In the current implementation, payment failure changes paymentStatus; the orderStatus field remains at its prior value.

## 7. Share-link flow

~~~mermaid
flowchart LR
  Click[Customer selects Share]
  Frontend[Build backend /product/:id URL]
  Share[GET /product/:id]
  DB[(Load product)]
  Meta[Render HTML title, description,<br/>Open Graph/Twitter metadata]
  Redirect[Meta refresh and canonical URL<br/>to frontend /product/:id]
  ProductPage[Frontend loads product details]
  Click --> Frontend --> Share --> DB --> Meta --> Redirect --> ProductPage
~~~

The backend share page is intended for crawlers that need product metadata. The storefront product-detail page then obtains current detail data through the API.

## 8. Build and deployment flow

~~~mermaid
flowchart TD
  Change[Change source]
  Commit[Commit and push configured GitHub branch]
  Render[Render reads Blueprint/services]
  BackendBuild[Backend root: Clickkdesi/backend<br/>npm ci, npm start]
  Health[Backend health check: /healthz]
  FrontBuild[Frontend root: Clickkdesi/frontend<br/>npm ci, npm run build]
  Dist[Publish frontend dist]
  Assets[Serve SPA and hashed assets]
  API[Serve API at configured backend URL]
  Browser[Browser requests storefront]
  BackendDeploy[Backend service deploys]
  FrontDeploy[Static service deploys]
  Change --> Commit --> Render
  Render --> BackendBuild --> Health --> BackendDeploy
  Render --> FrontBuild --> Dist --> FrontDeploy
  FrontDeploy --> Assets --> Browser
  BackendDeploy --> API --> Browser
~~~

The deployment definitions are in the repository render.yaml. Dashboard branch selection, auto-deploy settings, domain binding, secret values, and webhook configuration are managed in Render/Razorpay and must be checked there when operations change.

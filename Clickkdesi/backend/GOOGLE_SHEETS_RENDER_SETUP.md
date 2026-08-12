# Google Sheets Render Secret File Setup

1. In Google Cloud, create a new service-account JSON key.
2. Share the Google Sheet with the JSON file's `client_email` as Editor.
3. In Render, open the `clickkdesi-backend` service.
4. Add a Secret File named `google.json` and paste the full new JSON content.
5. Keep this environment variable:

   ```env
   GOOGLE_SERVICE_ACCOUNT_FILE=/etc/secrets/google.json
   ```

6. Delete old Google credential environment variables from Render:

   ```env
   GOOGLE_SERVICE_ACCOUNT
   GOOGLE_SERVICE_ACCOUNT_JSON
   GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
   GOOGLE_CLIENT_EMAIL
   GOOGLE_PRIVATE_KEY
   ```

7. Redeploy the backend.
8. Run this from the Render shell to verify access:

   ```bash
   npm run verify:sheet
   ```

9. Backfill paid orders that missed Google Sheets sync:

   ```bash
   npm run sync:pending-sheets
   ```

The automatic retry worker also runs every 15 minutes when `SHEET_RETRY_ENABLED=true`.

# Bandwidth-Safe Deploy Flow

1. Upload source media to Cloudinary:
   `cd Clickkdesi/backend && npm run upload:media`
2. Seed product media public IDs:
   `cd Clickkdesi/backend && npm run seed`
3. Set Render env vars from `backend/.env.example` and `frontend/.env.example`.

Large media now lives in `media-source` for upload only. The frontend and
backend no longer serve those files directly.

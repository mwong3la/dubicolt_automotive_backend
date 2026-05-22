# Dubiken API

Production-style Express + TypeScript API for the Dubiken Next.js app. Contract: `../dubiken/docs/API-SPEC.md`.

## Architecture

```
src/
  app.ts                      # HTTP server, middleware stack
  routes/                     # Thin routers → controllers only
    index.ts
    auth.routes.ts
    products.routes.ts
    storefront.routes.ts
    cart.routes.ts
    checkout.routes.ts
    sourcing.routes.ts        # /me/*
    admin.routes.ts
    shipments.routes.ts
  controllers/                # HTTP: parse request, call service, set status
  services/                   # Business logic (throws AppError)
  validators/                 # Request validation
  middlewares/
    auth.middleware.ts
    error.middleware.ts       # Global 404 + error handler
  errors/
    AppError.ts
  utils/
    asyncHandler.ts
    response.ts
    query.ts
  dubiken/
    store.ts                  # Postgres only (required)
    postgres.store.ts
  database/models/            # Sequelize + Postgres
  lib/azureBlob.ts
```

**Flow:** `Route → Controller → Service → Store → PostgreSQL`

**PostgreSQL is required** — the API will not start without `DB_*` env vars.

**Azure:** set `AZURE_STORAGE_*` for image uploads.

## Quick start

```bash
npm install
npm run build
npm run dev
```

Base URL: `http://localhost:3001/api/v1`

## Seed users

| Email | Password | Role |
|-------|----------|------|
| `admin@dubiken.com` | `Dubiken123!` | admin |
| `buyer@test.com` | `Dubiken123!` | buyer |

## Connect the UI

In `dubiken/.env.local`:

```
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

## Upload API

```bash
curl -X POST http://localhost:3001/api/v1/uploads/image \
  -H "Authorization: Bearer <token>" \
  -F "file=@./photo.jpg"
# → { "url": "https://<account>.blob.core.windows.net/..." }
```

Use returned `url` as `image_url` in category/product create bodies.

## First run

Creates tables (`sync`) and seeds demo data when the database is empty. Re-seed by truncating tables or using a fresh database.

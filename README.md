# Dubicolt Automotive API

Express + TypeScript API for the Dubicolt Automotive MVP — in-stock purchases and unavailable part requests.

## Architecture

```
src/
  app.ts
  routes/           # MVP API routers
  controllers/
  services/
  middlewares/
  dubicolt/
    store.ts        # Postgres store proxy
    mvp.store.ts    # MVP business logic
    seed.ts
  database/models/  # Sequelize + PostgreSQL
```

**Flow:** `Route → Controller → Service → dubicoltStore → PostgreSQL`

## Quick start

```bash
npm install
cp .env.example .env   # configure DB_*
npm run build
npm run dev
```

Base URL: `http://localhost:3001/api`

## Seed users

| Email | Password | Role |
|-------|----------|------|
| `admin@dubicolt.com` | `Dubicolt123!` | admin |
| `buyer@test.com` | `Dubicolt123!` | buyer |

## MVP API endpoints

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `login`, `GET /api/auth/profile` |
| Vehicles | `POST/GET/PUT/DELETE /api/vehicles` |
| Products | `POST/GET/PUT /api/products`, `GET /api/products/search` |
| Inventory | `POST /api/inventory/stock-in`, `stock-out`, `GET /api/inventory` |
| Cart | `GET/POST/PUT/DELETE /api/cart/items`, `POST /api/cart/checkout` |
| Orders | `GET /api/orders`, `GET /api/orders/:id` |
| Payments | `POST /api/payments/mpesa/stk-push`, `POST /api/payments/callback` |
| Part Requests | `POST/GET /api/part-requests` |
| Quotations | `POST/GET /api/quotations`, `accept`, `reject` |
| Suppliers | `POST/GET/PUT /api/suppliers` |
| Deliveries | `POST/GET /api/deliveries`, `POST /api/deliveries/:id/status` |
| Reports | `GET /api/reports/dashboard` |

## M-Pesa

Without `MPESA_*` env vars, STK push runs in sandbox mode and auto-completes payment for development.

## Upload API

```bash
curl -X POST http://localhost:3001/api/uploads/image \
  -H "Authorization: Bearer <token>" \
  -F "file=@./photo.jpg"
```

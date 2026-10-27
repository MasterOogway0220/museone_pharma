# MuseOne Pharma

Multi-tenant pharmacy billing (POS) for Indian pharmacies. Next.js + MySQL.
Rebuilt from [PharmaSpot](https://github.com/drkNsubuga/PharmaSpot) (MIT). Plan: [docs/PLAN.md](docs/PLAN.md).

## Run locally

Needs Node 24, pnpm 9 and Docker.

```sh
pnpm install
cp .env.example .env        # then fill BETTER_AUTH_SECRET and the SUPERADMIN_* values
docker compose up -d        # MySQL 8.4 on localhost:3318
pnpm db:migrate
pnpm db:seed                # creates the super admin from .env
pnpm dev
```

- Super admin: http://localhost:3000/admin/login
- A pharmacy's staff: http://localhost:3000/t/<slug>/login

## Checks

```sh
pnpm typecheck && pnpm lint && pnpm test   # unit tests, no DB
pnpm test:db                               # needs the docker MySQL
pnpm build && pnpm e2e                     # Playwright against the production build
```

## Schema changes

Edit `src/db/schema.ts`, then `pnpm db:generate` and `pnpm db:migrate`.

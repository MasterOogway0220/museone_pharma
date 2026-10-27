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
- A pharmacy's staff: http://localhost:3000/t/<slug>/login (or http://localhost:3000/sign-in)
- Public site: http://localhost:3000

## Checks

```sh
pnpm typecheck && pnpm lint && pnpm test   # unit tests, no DB
pnpm test:db                               # needs the docker MySQL
pnpm build && pnpm e2e                     # Playwright against the production build (port 3100)
pnpm build && pnpm screens                 # re-capture the landing page screenshots in public/screens
```

## Schema changes

Edit `src/db/schema.ts`, then `pnpm db:generate` and `pnpm db:migrate`.

## Desktop app (Windows counters)

`desktop/` is an Electron shell around a pharmacy's link: silent receipt printing, start on boot, locked to that pharmacy's site.

```sh
cd desktop
npm install            # downloads Electron (~100 MB)
npm start              # first run asks for the pharmacy link
npm run make           # Windows installer in desktop/out/make
```

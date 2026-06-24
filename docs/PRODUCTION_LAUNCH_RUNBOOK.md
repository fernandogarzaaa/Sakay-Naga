# Production Launch Runbook

Use this runbook for a same-day production launch. The application code can be built and smoke-tested from this repository, but the operator must provide production infrastructure, secrets, domain/DNS, and mobile distribution access.

## 1. Required infrastructure

- MySQL 8-compatible database with automated backups enabled.
- HTTPS application host for the `app` service.
- Production domain pointed at the HTTPS host.
- Secret store or deployment variables for `APP_SECRET`, `DATABASE_URL`, and optional `ADMIN_EMAIL`.
- Uptime monitor for `GET /api/health`.
- Centralized logs and error alerting for the web/API process.

## 2. Required production environment

Set these variables before starting the backend:

```text
NODE_ENV=production
APP_SECRET=<at least 32 random bytes, not reused from development>
DATABASE_URL=mysql://<user>:<password>@<host>:3306/<database>
ADMIN_EMAIL=<first admin email, optional but recommended>
PORT=3000
```

Set this before creating mobile preview or production builds:

```text
EXPO_PUBLIC_API_URL=https://<your-domain>/api/mobile
```

## 3. Pre-deploy checks

Run from `app/`:

```bash
npm run lint
npm run check
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Run from `mobile/`:

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

The app production audit must pass with no high or critical vulnerabilities. The mobile audit must pass with no high or critical vulnerabilities; any remaining moderate Expo/React Native transitive advisories must be risk-reviewed before launch.

## 4. Database setup

Apply the schema with one of these approaches:

```bash
cd app
npm run db:push
```

or apply the checked-in SQL migration files from `app/db/migrations/` using your database migration process.

Then seed and verify initial data:

```bash
npx tsx db/seed.ts
npx tsx db/check.ts
```

Before public launch, verify route names, stop order, coordinates, jeepney QR codes, and active vehicle records with local operational data.

## 5. Deployment

1. Build the Docker image from `app/`.
2. Deploy one instance first.
3. Confirm `GET https://<your-domain>/api/health` returns `ok: true`.
4. Confirm API logs have no startup errors.
5. Register the `ADMIN_EMAIL` account and confirm its role is `admin` in the database.

## 6. Launch smoke tests

Complete these tests against production before sharing the app publicly:

- Register a new rider account.
- Log out and log back in on web.
- Log out and log back in on mobile.
- View route list and route detail.
- Submit a crowding report with and without GPS coordinates.
- Promote a test account to `driver` and start a trip.
- End the active driver trip.
- Confirm a driver cannot end another driver's trip.
- Promote a test account to `operator` and open the operator dashboard.
- Confirm API responses do not expose `passwordHash`.
- Confirm `/api/health` is monitored and alerting.

## 7. Scaling notes

The current in-process rate limiter is acceptable for a single-instance launch. Before running multiple backend instances, replace it with Redis-backed limits or managed edge/WAF rate limiting so all instances share rate-limit state.

## 8. Rollback

- Keep the previous image tag or deployment artifact.
- Prefer additive/backward-compatible migrations during launch day.
- If auth, report, or trip errors spike, roll back the app image first.
- If bad route/jeepney data is discovered, mark affected records inactive before deleting data.

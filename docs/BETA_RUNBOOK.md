# Beta Runbook

## 1. Provision Infrastructure

1. Create a MySQL database.
2. Set production environment variables:
   - `APP_SECRET`: long random value, at least 32 characters.
   - `DATABASE_URL`: MySQL connection string.
   - `ADMIN_EMAIL`: email that should become the first admin account.
3. Deploy the `app` service behind HTTPS.
4. Confirm `GET /api/health` returns `{ "ok": true }`.

## 2. Apply Database Schema

Use one of these paths:

```powershell
cd D:\sakay-naga\app
npm run db:push
```

or apply:

```text
app/db/migrations/0001_local_auth.sql
```

## 3. Seed Initial Data

```powershell
cd D:\sakay-naga\app
npx tsx db/seed.ts
```

Then verify:

```powershell
npx tsx db/check.ts
```

## 4. Create Admin

1. Set `ADMIN_EMAIL` before starting the backend.
2. Register that email through the web or mobile app.
3. Confirm the account role is `admin` in the database.

## 5. Mobile Beta

Set the production API URL before building:

```powershell
$env:EXPO_PUBLIC_API_URL="https://YOUR_DOMAIN/api/mobile"
```

For beta distribution, use EAS builds:

```powershell
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

## 6. Smoke Tests

- Register a rider.
- Log out and log back in.
- View route list.
- View route details and stops.
- Submit crowding report.
- Promote a test user to `driver`; start/end a trip.
- Promote a test user to `operator`; open operator dashboard.
- Confirm no API response includes `passwordHash`.

## 7. Rollback

- Keep the previous deployment artifact or image tag.
- Use backward-compatible migrations for beta.
- If auth errors spike, roll back app image first; database migration is additive.

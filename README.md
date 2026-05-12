# Sakay Naga

Sakay Naga is a full-stack commuter platform for Naga City jeepney routes. It includes:

- Web app for riders, drivers, and operators.
- Hono/tRPC backend with MySQL and Drizzle ORM.
- Expo React Native app for iOS and Android.
- First-party email/password auth. No third-party OAuth dependency is required.

## Project Layout

```text
app/      Web frontend, backend API, database schema, migrations
mobile/   Expo React Native iOS/Android client
```

## Local Setup

Backend/web:

```powershell
cd D:\sakay-naga\app
copy .env.example .env
# Fill APP_SECRET and DATABASE_URL.
npm install
npm run db:push
npm run dev
```

Mobile:

```powershell
cd D:\sakay-naga\mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://localhost:3000/api/mobile"
npm start
```

For Android emulator use:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:3000/api/mobile"
```

For a physical phone, use your computer LAN IP.

## Verification

Run before beta release:

```powershell
cd D:\sakay-naga\app
npm run lint
npm run check
npm test
npm run build
npm run beta:check

cd D:\sakay-naga\mobile
npm run check
npm run beta:check
```

## Required Environment

`app/.env`:

```text
APP_SECRET=long-random-secret
DATABASE_URL=mysql://user:pass@host:3306/sakay_naga
ADMIN_EMAIL=admin@example.com
```

`ADMIN_EMAIL` is optional. If set, the first account registered with that email becomes `admin`.

## Beta Release State

See [BETA_RELEASE_CHECKLIST.md](BETA_RELEASE_CHECKLIST.md) for the remaining external work needed before announcing a public beta. The codebase now contains the web/backend app, the Expo mobile app, CI, Docker packaging, first-party auth, security middleware, and tests for the auth/security boundary.

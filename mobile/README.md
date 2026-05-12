# Sakay Naga Mobile

Expo React Native client for the Sakay Naga commuter app.

## What is implemented

- Rider route browsing with route crowding status.
- Route detail view with ordered stops.
- Active trip list.
- Crowding report flow with optional GPS coordinates.
- Driver trip start/end screen wired to authenticated mobile endpoints.
- Operator route crowding dashboard wired to authenticated mobile endpoints.
- Offline/demo fallback data when the backend is unreachable.

## Run

Install dependencies:

```powershell
npm install
```

Start the existing web/backend server from `D:\sakay-naga\app`:

```powershell
npm run dev
```

Start the mobile app from this directory:

```powershell
npm start
```

## API URL

The mobile client reads `EXPO_PUBLIC_API_URL`.

Use one of these values:

```powershell
# iOS simulator
$env:EXPO_PUBLIC_API_URL="http://localhost:3000/api/mobile"

# Android emulator
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:3000/api/mobile"

# Physical phone on the same Wi-Fi network
$env:EXPO_PUBLIC_API_URL="http://YOUR_COMPUTER_LAN_IP:3000/api/mobile"
```

Then run:

```powershell
npm start
```

## Auth

The app uses first-party Sakay Naga email/password accounts through `/api/mobile/auth/*` endpoints. Rider reports, driver mode, and operator metrics all use the same independent session cookie as the web app.

# Sakay Naga Beta Release Checklist

## Completed In Repo

- [x] Web app builds successfully.
- [x] Mobile Expo app typechecks.
- [x] Third-party OAuth dependency removed from source/docs.
- [x] First-party email/password auth implemented.
- [x] Mobile auth token persistence implemented with SecureStore.
- [x] Mobile REST API exists under `/api/mobile`.
- [x] Auth/session/security unit tests exist.
- [x] API security headers and basic in-memory rate limiting exist.
- [x] Dockerfile runs lint, typecheck, tests, and build during image creation.
- [x] GitHub Actions CI workflow added.
- [x] Database migration for local auth added.
- [x] EAS build configuration added for mobile preview builds.
- [x] Beta runbook added.
- [x] Production launch runbook added.
- [x] Driver/operator authorization hardening added for trip and profile APIs.
- [x] Trip/report domain validation added.
- [x] High/critical production dependency audit findings remediated or documented.

## Required Before Public Beta Announcement

- [ ] Initialize Git and push to a remote repository.
- [ ] Provision MySQL and set `DATABASE_URL`.
- [ ] Set a strong production `APP_SECRET`.
- [ ] Run `npm run db:push` or apply `app/db/migrations/0001_local_auth.sql`.
- [ ] Seed real Naga route/stop/jeepney data and verify coordinates.
- [ ] Create an admin account with `ADMIN_EMAIL`.
- [ ] Test web registration/login/logout against production database.
- [ ] Test mobile registration/login/report submission on Android.
- [ ] Test mobile registration/login/report submission on iOS.
- [ ] Publish Expo preview build or EAS beta build.
- [ ] Configure production domain and HTTPS.
- [ ] Add uptime monitoring against `/api/health`.
- [ ] Run the production launch runbook in `docs/PRODUCTION_LAUNCH_RUNBOOK.md`.

## Known Beta Constraints

- Real-time crowding currently uses fresh polling/report aggregation, not WebSockets.
- Driver/operator role elevation is database/admin-managed.
- In-memory rate limiting is acceptable for single-instance beta; use Redis or managed edge limits before scaling horizontally.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `npm run db:push` failed on MariaDB with `ER_PARSE_ERROR ... near 'AUTO_INCREMENT NOT NULL'`:
  drizzle's `serial()` makes drizzle-kit emit `serial AUTO_INCREMENT`, which MariaDB rejects.
  Primary keys are now declared as `bigint unsigned` + `autoincrement()` (same column type on
  MySQL 8, minus the redundant UNIQUE index that SERIAL added next to each PRIMARY KEY).
- CI now runs `drizzle-kit push` against MySQL 8.4 and MariaDB 11.

### Added / Changed
- Dependabot config for npm (app/, mobile/) and GitHub Actions (weekly)
- SECURITY.md with private reporting contact

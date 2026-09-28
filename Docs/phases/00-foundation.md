# Phase 0 — Foundation

## Goal

Produce a clean, reproducible Orbium repository with the agreed stack, authentication, PostgreSQL, Docker, application shell foundation, and quality gates.

This phase does **not** implement the knowledge hierarchy yet.

## Read first

- `START_HERE.md`
- `AGENTS.md`
- `docs/01-v0.1.0-scope.md`
- `docs/03-technical-architecture.md`
- `docs/11-security-self-hosting.md`
- `docs/12-testing-quality.md`

## Tasks

### 0.1 Bootstrap Laravel + React/Inertia

- Laravel 13
- PHP 8.4 compatibility
- React 19
- TypeScript
- Inertia
- Vite 8
- Tailwind CSS 4

Remove demo code not useful to Orbium.

**Commit:** `chore(app): bootstrap Orbium application`

### 0.2 PostgreSQL

- configure development/test PostgreSQL;
- enable `pg_trgm`;
- establish test database strategy;
- prove migrations run fresh.

**Commit:** `chore(database): configure PostgreSQL foundation`

### 0.3 Authentication

Implement standard secure authentication:

- register if product setup permits;
- login/logout;
- password handling;
- auth-protected application area.

No collaboration/organization model.

**Commit:** `feat(auth): add authenticated owner workflow`

### 0.4 Base visual tokens

Create design tokens/utilities for:

- dark/light/system appearance;
- neutral monochrome palette;
- semantic status colors;
- glass surfaces;
- focus ring;
- typography;
- motion durations/easing tokens.

Do not build Orbit yet.

**Commit:** `feat(ui): establish Orbium visual foundation`

### 0.5 Application shell skeleton

Create minimal:

- top shell;
- placeholder tabs region;
- breadcrumb region;
- account/settings access;
- empty authenticated home.

No fake finished functionality.

**Commit:** `feat(shell): add base authenticated app shell`

### 0.6 Zustand and motion foundation

Install/configure:

- Zustand;
- GSAP + React integration.

Create only small foundation utilities. Do not invent a global mega-store.

**Commit:** `chore(frontend): configure interaction state and motion`

### 0.7 Editor/3D dependencies

Install the agreed dependency families required by later phases:

- Tiptap core packages;
- Three.js;
- React Three Fiber;
- Drei.

Do not implement features early.

**Commit:** `chore(deps): add editor and spatial dependencies`

### 0.8 Docker self-host baseline

Create Docker Compose baseline:

```text
nginx
app
postgres
```

Requirements:

- persistent PostgreSQL volume;
- persistent application file volume;
- environment example;
- health/readiness behavior where practical;
- no Redis/Meilisearch/MinIO.

**Commit:** `chore(docker): add self-host development baseline`

### 0.9 Quality tooling

Set up:

- Pint;
- PHP tests;
- frontend lint;
- `types:check`;
- Vitest;
- Playwright foundation;
- build scripts.

Ensure the commands in `AGENTS.md` exist.

**Commit:** `chore(quality): establish verification toolchain`

## Expected result

After Phase 0 the user should see:

- Orbium login/auth flow;
- clean minimal authenticated shell;
- appearance foundation;
- no broken demo pages;
- working PostgreSQL-backed app;
- reproducible Docker startup.

Do **not** pretend Orbium's core knowledge features exist yet.

## Automated gate

Run the full standard gate plus:

- fresh PostgreSQL migration;
- Docker build/start smoke test;
- auth feature tests;
- one Playwright login/shell smoke path.

## Manual validation

1. Start Orbium from documented Docker/dev instructions.
   - Expected: app starts without undocumented manual fixes.
2. Create/login to an account.
   - Expected: authentication succeeds and protected shell opens.
3. Refresh authenticated page.
   - Expected: session remains valid.
4. Toggle Light/Dark/System.
   - Expected: shell changes cleanly with monochrome identity.
5. Restart containers.
   - Expected: persistent database state survives.
6. Check browser console/network.
   - Expected: no recurring errors or missing assets.

## Stop

Produce phase report and wait for user approval.

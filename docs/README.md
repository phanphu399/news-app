# MacroPulse — Documentation Baseline

> Current state snapshot: v14 (2026-09-14).
> Source code is the single source of truth.

## State Snapshot

| Attribute | Value |
|---|---|
| Git HEAD | bản `v14` (security + CI fixes) — xem `git log` |
| Branch | `main` |
| Remote | `phanphu399/news-app.git` → `origin main` |
| Frontend version | `v14` (`WEB_BUILD_VERSION` in `webPwa.js`, `BUILD_VERSION` in `build-web.mjs`) |
| SW cache | `aster-v14` |
| Stack (frontend) | Expo SDK ~57, React Native 0.86.3, React 19.2.3, react-native-web 0.21.2 |
| Stack (backend) | Vercel serverless (ESM, Node ≥18), Supabase (Postgres + Realtime) |
| Runtime | Web (PWA), iOS (Expo), Android (Expo) |

## How to Read These Docs

These documents describe the **current state** of the codebase. They do not prescribe architecture or suggest changes. Each document marks items with these tags when applicable:

| Tag | Meaning |
|---|---|
| `UNKNOWN` | We couldn't determine this from the source code alone |
| `NOT IMPLEMENTED` | Something was expected but doesn't exist in the code |
| `NOT FOUND` | A referenced file/module/resource doesn't exist |
| `REQUIRES RUNTIME VERIFICATION` | Only observable at runtime or depends on external state |

## Document Index

| File | Covers |
|---|---|
| [architecture.md](./architecture.md) | High-level architecture, repo layout, data flows, feature traces |
| [components.md](./components.md) | Shared components, UI primitives, icon sets |
| [views.md](./views.md) | Screen-level views (5 tabs + article modal), their props and behaviors |
| [services-and-state.md](./services-and-state.md) | NewsViewModel, all services, storage keys, event bus, hooks |
| [backend-and-data.md](./backend-and-data.md) | Vercel serverless endpoints, DB tables, cron jobs, scraper pipeline |
| [pwa-and-build.md](./pwa-and-build.md) | Service worker, manifest, versioning, update/install UX, build scripts, deploy |
| [config-and-unknowns.md](./config-and-unknowns.md) | Constants, env vars, app.json/eas.json, debt, unknowns, stale references |

## Repo Layout (Top-Level)

```
E:\news-app\
├── backend/            ← Vercel serverless (API + scraper + notifications)
├── db/                 ← SQL schemas, migrations, maintenance scripts
├── mobile/             ← Expo / React Native Web app (PWA)
├── .github/workflows/  ← CI (ci.yml)
├── README.md           ← STALE — references removed files
└── docs/               ← This documentation baseline
```

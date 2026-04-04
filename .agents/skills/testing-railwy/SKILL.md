# Testing Railwy Dashboard

## Overview
Railwy is a Next.js 14 dashboard for monitoring autonomous AI code generation projects. It uses MySQL (mysql2/promise) for data storage and is deployed to Hostinger Cloud Hosting.

## Prerequisites
- Node.js 18+
- MySQL 8.x (for full E2E testing)

## Quick Start
```bash
npm install
npm run dev    # starts dev server on localhost:3000
```

## Test Commands
```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run test        # Vitest (109 unit/integration tests)
npm run build       # Production build
```

## What Can Be Tested Without MySQL
The app uses a lazy MySQL connection pool — it doesn't connect until a query is made. This means:
- **Dev server starts fine** without MySQL
- **Health endpoint** (`/api/health`) works without DB
- **Homepage renders** — shows title, search/filter, "Register Project" button, and "No projects registered yet."
- **Register Project form** — opens, accepts input, shows error message when DB is unavailable
- **API error handling** — all API routes return structured JSON errors `{"error":{"code":"...","message":"..."}}`
- **All 109 unit tests pass** — they use mocks, no real DB needed

## What Requires MySQL
- Full CRUD operations (register, list, detail, delete projects)
- GitHub polling and status updates
- `status_json` JSON column round-trip (mysql2 auto-parses JSON columns)
- StagePipeline error badge with real project data
- Stats endpoint with aggregated data

## MySQL Connection
The database is on the Hostinger Cloud Hosting server (`localhost`). It is NOT accessible remotely. Full E2E testing with MySQL must be done after deploying to Hostinger.

Connection config is in `.env` (see `.env.example`):
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=<username>
MYSQL_PASSWORD=<password>
MYSQL_DATABASE=<database>
```

## Key Pages & Endpoints
| Path | Type | Description |
|------|------|-------------|
| `/` | Page | Dashboard homepage with project list, search, filter, stats |
| `/projects/[id]` | Page | Project detail with stage pipeline, error panel |
| `/api/health` | GET | Health check (no DB) |
| `/api/projects` | GET/POST | List or register projects |
| `/api/projects/[id]` | GET/DELETE | Get or delete project |
| `/api/projects/[id]/refresh` | POST | Force refresh project status from GitHub |
| `/api/stats` | GET | Aggregated project statistics |

## Known Issues & Gotchas
- **mysql2 auto-parses JSON columns** — `status_json` is returned as a JS object, not a string. The code handles both cases with a `typeof` check.
- **`description` column is `TEXT` (nullable)** — the `create` method defaults to empty string via `data.description ?? ''`.
- **StagePipeline** — "error" is not in the STAGES array. When `stage === 'error'`, all pipeline stages render as gray/inactive and a separate red "error" badge is appended.
- **Port 3000 conflicts** — if the dev server fails to start with EADDRINUSE, kill the existing process: `fuser -k 3000/tcp`

## Devin Secrets Needed
- `MYSQL_PASSWORD` — MySQL database password (session-only, stored on Hostinger)

# Railwy — Build Dashboard

Real-time monitoring dashboard for autonomous AI code generation projects. Polls GitHub repositories for `STATUS.json` files, displays per-project progress, and provides aggregate statistics.

## Setup

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `MYSQL_HOST` | MySQL server hostname |
| `MYSQL_PORT` | MySQL server port (default: 3306) |
| `MYSQL_USER` | MySQL username |
| `MYSQL_PASSWORD` | MySQL password |
| `MYSQL_DATABASE` | Database name (default: build_dashboard) |
| `GITHUB_TOKEN` | GitHub PAT for higher rate limits (optional) |
| `NEXT_PUBLIC_POLL_INTERVAL` | Client polling interval in ms (default: 30000) |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## Build

```bash
npm run build
npm start
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Register a project |
| GET | `/api/projects/[id]` | Project detail |
| DELETE | `/api/projects/[id]` | Remove project |
| POST | `/api/projects/[id]/refresh` | Force refresh from GitHub |
| GET | `/api/stats` | Aggregate statistics |

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **MySQL 8** with mysql2/promise
- **Tailwind CSS** for styling
- **SWR** for client-side data fetching
- **Zod** for validation
- **Vitest** + React Testing Library for tests

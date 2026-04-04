# Build Dashboard — Autonomous Code Generation Monitor

## Overview

A real-time monitoring dashboard that tracks the progress of autonomous AI code generation projects. It polls GitHub repositories for STATUS.json files, displays per-project progress (stage, tasks, errors, time estimates), and provides aggregate statistics across all tracked projects. Built for developers using the Claude Code + ECC autonomous build pipeline.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20.x LTS |
| Framework | Next.js (App Router) | 14.x |
| Database | SQLite | 3.x |
| SQLite Driver | better-sqlite3 | 11.x |
| UI Framework | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Testing | Vitest + React Testing Library | 1.x / 14.x |
| Linting | ESLint | 8.x |
| Validation | Zod | 3.x |
| HTTP Client | Native fetch (Node 20) | built-in |
| Date Formatting | date-fns | 3.x |

### Do NOT Use

- Prisma or any heavy ORM — use better-sqlite3 directly with raw SQL
- Redux or Zustand — use React Server Components + SWR for data fetching
- Docker — app runs directly on Node.js
- External databases (Postgres, MySQL) — SQLite only
- NextAuth or any auth library — dashboard is open access (no auth)
- Socket.io or WebSockets — use client-side polling with SWR

## Folder Structure

```
railwy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard homepage
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Project detail page
│   │   └── api/
│   │       ├── projects/
│   │       │   ├── route.ts           # GET (list) + POST (register)
│   │       │   └── [id]/
│   │       │       ├── route.ts       # GET (detail) + DELETE (remove)
│   │       │       └── refresh/
│   │       │           └── route.ts   # POST (force refresh)
│   │       └── stats/
│   │           └── route.ts           # GET (aggregate stats)
│   ├── lib/
│   │   ├── db.ts               # SQLite connection + migrations
│   │   ├── github.ts           # GitHub API client
│   │   ├── poller.ts           # Polling service logic
│   │   └── validators.ts      # Zod schemas
│   ├── repositories/
│   │   └── project.ts          # Project data access layer
│   ├── services/
│   │   ├── project.ts          # Project business logic
│   │   └── github.ts           # GitHub fetching logic
│   ├── components/
│   │   ├── ProjectCard.tsx     # Project summary card
│   │   ├── ProjectDetail.tsx   # Full project view
│   │   ├── StagePipeline.tsx   # Stage visualization
│   │   ├── TaskList.tsx        # Task list with status
│   │   ├── ErrorPanel.tsx      # Error display
│   │   ├── StatsBar.tsx        # Aggregate statistics bar
│   │   └── SearchFilter.tsx    # Search and filter controls
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── tests/
│   ├── unit/
│   ├── integration/
│   │   └── smoke.test.ts
│   └── helpers/
├── public/
├── .status/
│   └── STATUS.json
├── scripts/
│   └── generate-codemap.sh
├── CLAUDE.md
├── PROJECT.md
├── TASKS.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── CODEMAP.md
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Architecture Decisions

1. **Next.js App Router** — Server Components reduce client JS bundle, API routes colocated with pages
2. **SQLite with better-sqlite3** — Zero-config embedded DB, synchronous API is simpler, no external service needed
3. **SWR for client polling** — `refreshInterval` option provides automatic re-fetching every 30s without WebSockets
4. **No authentication** — Dashboard is a personal dev tool, not a multi-tenant SaaS
5. **GitHub REST API v3** — Simpler than GraphQL for reading single files from repos
6. **Zod for validation** — Runtime type validation for API inputs and GitHub responses
7. **Server-side polling trigger** — API route `/api/projects/[id]/refresh` triggers a fetch from GitHub; client polls the API, not GitHub directly

## API Endpoints

### GET /api/projects

List all registered projects.

**Auth:** None

**Request:** No body

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "task-api",
      "description": "REST API for task management",
      "repoUrl": "https://github.com/user/task-api",
      "branch": "build/auto-task-api",
      "stage": "building",
      "percentage": 56,
      "currentTask": 15,
      "totalTasks": 25,
      "errorCount": 1,
      "lastPolledAt": "2026-03-26T15:30:00Z",
      "createdAt": "2026-03-25T10:00:00Z",
      "updatedAt": "2026-03-26T15:30:00Z"
    }
  ]
}
```

**Errors:**
- 500: `{ "error": { "code": "INTERNAL_ERROR", "message": "Failed to fetch projects" } }`

---

### POST /api/projects

Register a new project to track.

**Auth:** None

**Request:**
```json
{
  "repoUrl": "https://github.com/user/task-api",
  "branch": "build/auto-task-api"
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "name": "task-api",
    "description": "REST API for task management",
    "repoUrl": "https://github.com/user/task-api",
    "branch": "build/auto-task-api",
    "stage": "pending",
    "percentage": 0,
    "currentTask": 0,
    "totalTasks": 0,
    "errorCount": 0,
    "lastPolledAt": null,
    "createdAt": "2026-03-25T10:00:00Z",
    "updatedAt": "2026-03-25T10:00:00Z"
  }
}
```

**Errors:**
- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "repoUrl is required", "field": "repoUrl" } }`
- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid GitHub URL format", "field": "repoUrl" } }`
- 409: `{ "error": { "code": "CONFLICT", "message": "Project already registered" } }`
- 500: `{ "error": { "code": "INTERNAL_ERROR", "message": "Failed to register project" } }`

---

### GET /api/projects/[id]

Get full project details including cached STATUS.json.

**Auth:** None

**Request:** No body

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "name": "task-api",
    "description": "REST API for task management",
    "repoUrl": "https://github.com/user/task-api",
    "branch": "build/auto-task-api",
    "stage": "building",
    "statusJson": {
      "project": "task-api",
      "description": "REST API for task management",
      "stage": "building",
      "plan_review": "approved",
      "progress": {
        "total_tasks": 25,
        "completed": 14,
        "current_task": 15,
        "current_task_name": "Task assignment endpoint",
        "current_task_status": "fixing",
        "fix_attempt": 2,
        "percentage": 56
      },
      "time_estimate": {
        "method": "heuristic",
        "remaining_minutes": 45
      },
      "branch": "build/auto-task-api",
      "lock": { "active": true, "since": "2026-03-26T14:00:00Z" },
      "last_updated": "2026-03-26T15:30:00Z",
      "tasks": [],
      "verification": {
        "build": "pass",
        "lint": "pass",
        "typecheck": "pass",
        "tests": "fail",
        "coverage": 82
      },
      "errors": []
    },
    "lastPolledAt": "2026-03-26T15:30:00Z",
    "createdAt": "2026-03-25T10:00:00Z",
    "updatedAt": "2026-03-26T15:30:00Z"
  }
}
```

**Errors:**
- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid project ID" } }`
- 404: `{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }`

---

### DELETE /api/projects/[id]

Remove a tracked project.

**Auth:** None

**Request:** No body

**Response (200):**
```json
{
  "data": { "message": "Project removed successfully" }
}
```

**Errors:**
- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid project ID" } }`
- 404: `{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }`

---

### POST /api/projects/[id]/refresh

Force refresh a project's STATUS.json from GitHub.

**Auth:** None

**Request:** No body

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "stage": "building",
    "percentage": 60,
    "lastPolledAt": "2026-03-26T15:35:00Z"
  }
}
```

**Errors:**
- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid project ID" } }`
- 404: `{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }`
- 502: `{ "error": { "code": "GITHUB_ERROR", "message": "Failed to fetch STATUS.json from GitHub" } }`

---

### GET /api/stats

Get aggregate statistics across all projects.

**Auth:** None

**Request:** No body

**Response (200):**
```json
{
  "data": {
    "totalProjects": 5,
    "activeProjects": 2,
    "completedProjects": 2,
    "erroredProjects": 1,
    "totalTasksCompleted": 87,
    "totalTasksRemaining": 18
  }
}
```

**Errors:**
- 500: `{ "error": { "code": "INTERNAL_ERROR", "message": "Failed to fetch statistics" } }`

## Database Schema

### projects

| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| description | TEXT | DEFAULT '' |
| repo_url | TEXT | NOT NULL, UNIQUE |
| branch | TEXT | NOT NULL |
| stage | TEXT | NOT NULL, DEFAULT 'pending' |
| status_json | TEXT | DEFAULT NULL (JSON string) |
| percentage | INTEGER | DEFAULT 0 |
| current_task | INTEGER | DEFAULT 0 |
| total_tasks | INTEGER | DEFAULT 0 |
| error_count | INTEGER | DEFAULT 0 |
| last_polled_at | TEXT | DEFAULT NULL (ISO 8601) |
| created_at | TEXT | NOT NULL (ISO 8601) |
| updated_at | TEXT | NOT NULL (ISO 8601) |

### poll_logs

| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| project_id | INTEGER | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| success | INTEGER | NOT NULL (0 or 1) |
| error_message | TEXT | DEFAULT NULL |
| polled_at | TEXT | NOT NULL (ISO 8601) |

## Business Rules

1. A project is identified by its `repo_url` — no two projects can have the same `repo_url`
2. When registering, the `repoUrl` must be a valid GitHub URL matching pattern `https://github.com/{owner}/{repo}`
3. The `branch` field defaults to `build/auto-{repo-name}` if not provided
4. When a project's stage is `"complete"`, polling stops for that project (cached result served)
5. Polling fetches `.status/STATUS.json` from the specified branch via GitHub Contents API
6. If GitHub returns 404 for STATUS.json, the project stage is set to `"pending"` and error is logged
7. If GitHub returns any other error, the project keeps its last known state and error is logged in poll_logs
8. The `name` and `description` fields are extracted from STATUS.json on first successful poll
9. `percentage`, `current_task`, `total_tasks`, and `error_count` are extracted from STATUS.json on each poll
10. Projects are sorted by `updated_at` descending (most recently updated first) in the list view

## Error Handling Format

**Success response:**
```json
{
  "data": { ... }
}
```

**Error response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "field": "fieldName"
  }
}
```

**HTTP status code mapping:**
| Status | Usage |
|---|---|
| 200 | Successful read/update/delete |
| 201 | Successful create |
| 400 | Validation error (bad input) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 500 | Internal server error |
| 502 | Upstream error (GitHub API) |

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| DATABASE_PATH | Path to SQLite database file | ./data/dashboard.db |
| GITHUB_TOKEN | GitHub personal access token (optional, for higher rate limits) | ghp_xxxxxxxxxxxx |
| NEXT_PUBLIC_POLL_INTERVAL | Client-side polling interval in ms | 30000 |
| NODE_ENV | Environment | development |

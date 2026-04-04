# Architecture Rules

## Layers

```
┌─────────────────────────────────┐
│  Pages (src/app/)               │  Next.js route handlers + React pages
│  - API route handlers           │  - Validate input, call services, format response
│  - Page components              │  - Fetch data via SWR, render UI components
├─────────────────────────────────┤
│  Components (src/components/)   │  Presentational React components
│  - Receive props, render UI     │  - No direct API calls or DB access
│  - Emit events via callbacks    │
├─────────────────────────────────┤
│  Services (src/services/)       │  Business logic
│  - Orchestrate operations       │  - Call repositories and external APIs
│  - Enforce business rules       │  - Throw typed errors
├─────────────────────────────────┤
│  Repositories (src/repositories/)│  Data access layer
│  - Raw SQL queries via better-sqlite3│
│  - Return typed objects         │  - No business logic
├─────────────────────────────────┤
│  Lib (src/lib/)                 │  Shared utilities
│  - Database connection          │  - GitHub API client
│  - Zod schemas                  │  - Polling logic
├─────────────────────────────────┤
│  Types (src/types/)             │  TypeScript interfaces and type definitions
│  - Shared across all layers     │
└─────────────────────────────────┘
```

## Import Rules

| From \ To | Types | Lib | Repositories | Services | Components | Pages |
|-----------|-------|-----|-------------|----------|------------|-------|
| **Types** | - | NO | NO | NO | NO | NO |
| **Lib** | YES | - | NO | NO | NO | NO |
| **Repositories** | YES | YES | - | NO | NO | NO |
| **Services** | YES | YES | YES | - | NO | NO |
| **Components** | YES | NO | NO | NO | YES | NO |
| **Pages** | YES | NO | NO | YES | YES | NO |

### Forbidden Imports

- Components MUST NOT import from repositories, services, or lib
- Repositories MUST NOT import from services or pages
- Services MUST NOT import from components or pages
- Lib MUST NOT import from repositories, services, components, or pages
- No circular dependencies between any modules
- No importing from `node_modules` directly — use the installed package name

### API Route Import Rules

- API routes (src/app/api/**) CAN import from: services, lib, types
- API routes MUST NOT import from: components, repositories directly
- All database access goes through services → repositories

### Page Import Rules

- Page components (src/app/**/page.tsx) CAN import from: components, services (for server components), types
- Client components use SWR to fetch from API routes — no direct service imports

## Naming Conventions

### Files
- React components: PascalCase (`ProjectCard.tsx`, `StagePipeline.tsx`)
- Everything else: camelCase (`project.ts`, `github.ts`, `validators.ts`)
- Test files: `{name}.test.ts` or `{name}.test.tsx`
- API routes: `route.ts` (Next.js convention)

### Code
- Interfaces/Types: PascalCase with descriptive names (`Project`, `StatusJson`, `CreateProjectInput`)
- Functions: camelCase verb-first (`fetchStatusJson`, `createProject`, `parseGitHubUrl`)
- Constants: UPPER_SNAKE_CASE (`DATABASE_PATH`, `DEFAULT_POLL_INTERVAL`)
- Variables: camelCase (`projectId`, `repoUrl`, `statusJson`)
- Database columns: snake_case (`repo_url`, `last_polled_at`, `status_json`)
- API response fields: camelCase (`repoUrl`, `lastPolledAt`, `statusJson`)

### React Components
- One component per file
- Component name matches file name (`ProjectCard.tsx` exports `ProjectCard`)
- Props interface named `{Component}Props` (`ProjectCardProps`)

## Required Patterns

### API Route Handlers
Every API route handler follows this pattern:
```typescript
export async function METHOD(request: Request) {
  try {
    // 1. Parse and validate input (Zod)
    // 2. Call service method
    // 3. Return formatted success response
  } catch (error) {
    // 4. Return formatted error response
  }
}
```

### Error Responses
All errors use the standard format from PROJECT.md:
```typescript
return NextResponse.json(
  { error: { code: "ERROR_CODE", message: "description" } },
  { status: 400 }
);
```

### Database Access
- All SQL queries go through repository classes
- Use parameterized queries (never string interpolation for values)
- Return typed objects, never raw rows

### Async Functions
- All async functions have try/catch at the top level
- Errors are caught, logged, and re-thrown or converted to API responses
- Never swallow errors silently

### React Components
- Use TypeScript props interfaces for all components
- Use Tailwind CSS classes — no inline styles, no CSS modules
- Server Components by default, add `"use client"` only when needed (event handlers, hooks, browser APIs)

## Forbidden Patterns

- No `any` type — use `unknown` and narrow with type guards if needed
- No `@ts-ignore` or `@ts-expect-error`
- No `as unknown as T` type assertions
- No global mutable state
- No `console.log` in source code (allowed in tests)
- No direct database queries outside repository layer
- No inline SQL in services or API routes
- No CSS-in-JS or styled-components — Tailwind only
- No barrel exports (`index.ts` re-exporting everything)
- No default exports except for Next.js pages and layouts (required by framework)
- No `var` — use `const` or `let`
- No nested ternaries

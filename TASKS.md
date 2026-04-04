# TASKS.md — Build Dashboard Micro-Tasks

> Each task: max 2 source files, max 10 test cases, explicit test scenarios.
> Task 1 = scaffold. Every 5th = smoke checkpoint. Final = self-review.

---

## Task 1: Project scaffold [x] [size: medium]

**Files:** package.json, tsconfig.json, next.config.js, tailwind.config.ts, vitest.config.ts

**Implementation:**
- Initialize Next.js 14 project with TypeScript and App Router
- Configure Tailwind CSS
- Configure Vitest with React Testing Library
- Configure ESLint with Next.js rules
- Create folder structure per PROJECT.md
- Create .env.example and .gitignore
- Health check endpoint: GET /api/health → `{ "status": "ok" }`

**Test cases:**

Happy path:
- Health check returns 200 with `{ "status": "ok" }` → 200

Build verification:
- Build succeeds with zero errors
- Lint passes with zero errors
- Type check passes with zero errors

**Acceptance:** install, build, lint, typecheck, and test all succeed

---

## Task 2: Database setup with MySQL [x] [size: medium]

**Files:** src/lib/db.ts, src/types/index.ts

**Implementation:**
- Install mysql2
- Create database connection pool module using mysql2/promise with configurable connection via MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE env vars
- Create migration function that creates `projects` and `poll_logs` tables per PROJECT.md schema (MySQL syntax: INT AUTO_INCREMENT, VARCHAR, DATETIME, JSON type)
- Auto-run migrations on first connection (CREATE TABLE IF NOT EXISTS)
- Export TypeScript interfaces for Project, PollLog, StatusJson, and API response types

**Test cases:**

Happy path:
- Database connection pool initializes successfully → connection works
- Migration creates tables with correct columns and types → schema matches

Constraints:
- repo_url column has UNIQUE constraint → inserting duplicate throws error
- project_id FK in poll_logs references projects(id) → FK constraint exists
- ON DELETE CASCADE works → deleting project removes its poll_logs

Edge cases:
- Calling migration twice is idempotent (CREATE TABLE IF NOT EXISTS) → no error, same tables
- Connection pool handles concurrent requests → multiple queries succeed

**Acceptance:** all tests pass, /verify green

---

## Task 3: Project repository layer [x] [size: medium]

**Files:** src/repositories/project.ts, tests/unit/project-repository.test.ts

**Implementation:**
- Create ProjectRepository class with methods:
  - `create(data: CreateProjectInput): Project`
  - `findAll(): Project[]`
  - `findById(id: number): Project | null`
  - `findByRepoUrl(repoUrl: string): Project | null`
  - `update(id: number, data: UpdateProjectInput): Project | null`
  - `delete(id: number): boolean`
  - `getStats(): ProjectStats`

**Test cases:**

Happy path:
- create() inserts a project and returns it with id and timestamps → project has id

CRUD operations:
- findAll() returns all projects sorted by updated_at desc → correct order
- findById() returns project when exists → matching project
- findById() returns null when not exists → null
- findByRepoUrl() returns project when exists → matching project
- update() modifies fields and updates updated_at → fields changed
- delete() removes project and returns true → true, project gone

Edge cases:
- create() with duplicate repo_url throws error → error mentions unique
- delete() with non-existent id returns false → false
- getStats() returns correct counts for active/completed/errored → counts match

**Acceptance:** all tests pass, /verify green

---

## Task 4: Register project endpoint — POST /api/projects [x] [size: medium]

**Files:** src/lib/validators.ts, src/app/api/projects/route.ts

**Implementation:**
- Create Zod schema for project registration input (repoUrl required, branch optional)
- Implement POST /api/projects handler:
  - Validate input with Zod
  - Extract owner/repo from GitHub URL
  - Default branch to `build/auto-{repo-name}` if not provided
  - Check for duplicate repo_url
  - Create project via repository
  - Return 201 with project data

**Test cases:**

Happy path:
- Valid repoUrl and branch → 201 with project data including id

Input validation:
- Missing repoUrl → 400 with error mentioning "repoUrl"
- Empty repoUrl → 400 with validation error
- Invalid URL format (not GitHub) → 400 with "Invalid GitHub URL format"
- Missing body entirely → 400 with validation error

Business rules:
- Duplicate repoUrl → 409 with "Project already registered"
- No branch provided → 201 with auto-generated branch name

Edge cases:
- repoUrl with trailing slash → 201 (normalized)
- repoUrl with .git suffix → 201 (normalized)

**Acceptance:** all tests pass, /verify green

---

## Task 5: Smoke test checkpoint 1 [x] [size: small]

**Files:** tests/integration/smoke.test.ts

**Implementation:**
- Create integration test covering tasks 1-4
- Test full flow: health check → register project → verify in database
- Each step verifies response matches PROJECT.md spec

**Test cases:**
- GET /api/health returns 200 with `{ "status": "ok" }` → passes
- POST /api/projects with valid GitHub URL returns 201 → project created
- POST same URL again returns 409 → conflict
- Database contains the registered project with correct fields → verified
- Entire flow completes without errors → passes

**Acceptance:** integration test passes, all previous tests pass

---

## Task 6: List projects endpoint — GET /api/projects [x] [size: small]

**Files:** src/app/api/projects/route.ts

**Implementation:**
- Add GET handler to existing projects route file
- Return all projects sorted by updated_at desc
- Map database fields to camelCase API response format

**Test cases:**

Happy path:
- Returns 200 with array of projects → correct format

Data:
- Returns projects sorted by updated_at descending → most recent first
- Each project has all required fields (id, name, repoUrl, stage, percentage, etc.) → all present
- Empty database returns empty array → `{ "data": [] }`

Response format:
- Fields are camelCase (repoUrl not repo_url, lastPolledAt not last_polled_at) → camelCase

**Acceptance:** all tests pass, /verify green

---

## Task 7: Project detail and delete endpoints [x] [size: medium]

**Files:** src/app/api/projects/[id]/route.ts, src/services/project.ts

**Implementation:**
- Create ProjectService with business logic methods
- Implement GET /api/projects/[id] — return full project with statusJson parsed
- Implement DELETE /api/projects/[id] — remove project

**Test cases:**

Happy path:
- GET existing project returns 200 with full data including statusJson → correct
- DELETE existing project returns 200 with success message → removed

Not found:
- GET non-existent id returns 404 → "Project not found"
- DELETE non-existent id returns 404 → "Project not found"

Input validation:
- GET with non-numeric id returns 400 → "Invalid project ID"
- DELETE with non-numeric id returns 400 → "Invalid project ID"

Response format:
- statusJson is parsed JSON object (not string) in response → object type

**Acceptance:** all tests pass, /verify green

---

## Task 8: GitHub API client [size: medium]

**Files:** src/lib/github.ts, src/services/github.ts

**Implementation:**
- Create GitHub client that fetches file contents via GitHub Contents API
- `fetchStatusJson(owner: string, repo: string, branch: string): StatusJson | null`
- Parse owner/repo from GitHub URL utility
- Handle GitHub API errors (404, rate limit, network errors)
- Support optional GITHUB_TOKEN for higher rate limits

**Test cases:**

Happy path:
- parseGitHubUrl extracts owner and repo from valid URL → correct values

URL parsing:
- Handles URL with trailing slash → correct
- Handles URL with .git suffix → correct
- Rejects non-GitHub URL → throws error
- Rejects malformed URL → throws error

Error handling:
- GitHub 404 returns null → null
- GitHub rate limit (403) throws descriptive error → error with rate limit message
- Network error throws descriptive error → error with network message

**Acceptance:** all tests pass, /verify green

---

## Task 9: Polling service [size: medium]

**Files:** src/lib/poller.ts, src/repositories/project.ts (add poll_log methods)

**Implementation:**
- Create pollProject function that:
  - Fetches STATUS.json from GitHub for a project
  - Updates project fields (stage, percentage, currentTask, totalTasks, errorCount, statusJson)
  - Extracts name and description from STATUS.json on first successful poll
  - Logs poll result to poll_logs table
  - Skips projects with stage "complete"
- Add PollLogRepository methods: createLog, getLogsByProjectId

**Test cases:**

Happy path:
- Successful poll updates project fields from STATUS.json → fields match

Business rules:
- First successful poll sets project name and description from STATUS.json → extracted
- Completed projects (stage "complete") are skipped → not polled
- Poll failure logs error to poll_logs → error_message populated

Data extraction:
- percentage extracted from progress.percentage → correct value
- current_task extracted from progress.current_task → correct value
- total_tasks extracted from progress.total_tasks → correct value
- error_count equals length of errors array in STATUS.json → correct count

**Acceptance:** all tests pass, /verify green

---

## Task 10: Smoke test checkpoint 2 [size: small]

**Files:** tests/integration/smoke.test.ts (extend existing)

**Implementation:**
- Extend integration test covering tasks 6-9
- Test flow: register project → list projects → get detail → delete → verify removed
- Test polling service with mock GitHub response

**Test cases:**
- GET /api/projects returns registered project in list → found
- GET /api/projects/[id] returns full detail with all fields → complete
- DELETE /api/projects/[id] removes project → 200
- GET /api/projects after delete returns empty list → empty
- Poll service updates project fields correctly → fields updated
- Entire flow completes without errors → passes

**Acceptance:** integration test passes, all previous tests pass

---

## Task 11: Force refresh endpoint [size: small]

**Files:** src/app/api/projects/[id]/refresh/route.ts

**Implementation:**
- Implement POST /api/projects/[id]/refresh
- Triggers immediate poll of STATUS.json from GitHub
- Returns updated project summary (id, stage, percentage, lastPolledAt)

**Test cases:**

Happy path:
- Force refresh existing project returns 200 with updated data → refreshed

Error handling:
- Non-existent project returns 404 → "Project not found"
- Invalid id returns 400 → "Invalid project ID"
- GitHub fetch failure returns 502 → "Failed to fetch STATUS.json from GitHub"

**Acceptance:** all tests pass, /verify green

---

## Task 12: Aggregate stats endpoint [size: small]

**Files:** src/app/api/stats/route.ts

**Implementation:**
- Implement GET /api/stats
- Query database for aggregate counts using ProjectRepository.getStats()
- Return totalProjects, activeProjects, completedProjects, erroredProjects, totalTasksCompleted, totalTasksRemaining

**Test cases:**

Happy path:
- Returns 200 with correct aggregate stats → all counts match

Data accuracy:
- Zero projects returns all zeros → zeroed stats
- Mix of active/completed/errored projects → correct counts per stage
- totalTasksCompleted sums completed tasks across all projects → correct sum
- totalTasksRemaining sums remaining tasks across all projects → correct sum

**Acceptance:** all tests pass, /verify green

---

## Task 13: Dashboard homepage UI — project cards [size: medium]

**Files:** src/components/ProjectCard.tsx, src/app/page.tsx

**Implementation:**
- Create ProjectCard component showing: name, stage badge, progress bar, percentage, current task info, error count indicator, last polled timestamp
- Create dashboard homepage that fetches and displays project cards
- Use SWR with refreshInterval for auto-polling
- Show empty state when no projects registered

**Test cases:**

Renders:
- ProjectCard renders with all required fields visible → all fields shown
- Dashboard page renders without error → mounts

Props:
- ProjectCard shows correct stage badge color (building=blue, complete=green, error=red) → correct colors
- Progress bar width matches percentage prop → correct width

Conditional rendering:
- Error count badge hidden when errorCount is 0 → not visible
- Empty state shown when no projects → "No projects" message displayed

**Acceptance:** all tests pass, /verify green

---

## Task 14: Project detail page UI [size: medium]

**Files:** src/components/ProjectDetail.tsx, src/app/projects/[id]/page.tsx

**Implementation:**
- Create ProjectDetail component showing full project info
- Display task list from statusJson.tasks
- Display verification status (build, lint, typecheck, tests, coverage)
- Display errors with file/line info
- Refresh button triggers POST /api/projects/[id]/refresh
- Use SWR for data fetching with auto-refresh

**Test cases:**

Renders:
- ProjectDetail renders with all sections visible → mounts with sections

Props:
- Task list shows correct status icons per task → icons match status
- Verification section shows pass/fail indicators → correct indicators

User interaction:
- Refresh button triggers API call → fetch called with correct URL

Conditional rendering:
- Error section hidden when no errors → not visible
- Loading state shown while fetching → spinner visible

**Acceptance:** all tests pass, /verify green

---

## Task 15: Smoke test checkpoint 3 [size: small]

**Files:** tests/integration/smoke.test.ts (extend existing)

**Implementation:**
- Extend integration test covering tasks 11-14
- Test force refresh endpoint behavior
- Test stats endpoint with multiple projects in different stages
- Test that UI components render with mock data

**Test cases:**
- POST /api/projects/[id]/refresh returns updated project → refreshed
- GET /api/stats returns correct counts for mixed-stage projects → accurate
- ProjectCard component renders project data correctly → all fields
- ProjectDetail component renders task list and errors → complete
- Entire flow completes without errors → passes

**Acceptance:** integration test passes, all previous tests pass

---

## Task 16: Stage pipeline visualization [size: small]

**Files:** src/components/StagePipeline.tsx

**Implementation:**
- Create StagePipeline component showing: pending → plan_review → building → testing → complete
- Current stage highlighted, completed stages marked with checkmark
- Animate transitions between stages
- Use Tailwind for styling (no CSS-in-JS)

**Test cases:**

Renders:
- Component renders all 5 stages → all stage labels visible

Props:
- Current stage is highlighted (different background color) → highlighted
- Previous stages show checkmark icon → checkmarks present
- Future stages are dimmed/inactive → dimmed styling

Conditional rendering:
- "pending" stage shows only first step active → only pending highlighted
- "complete" stage shows all steps with checkmarks → all checked

**Acceptance:** all tests pass, /verify green

---

## Task 17: Error panel and stats bar [size: medium]

**Files:** src/components/ErrorPanel.tsx, src/components/StatsBar.tsx

**Implementation:**
- Create ErrorPanel component:
  - List errors with task_id, message, file, line, timestamp
  - Collapsible per-error detail
  - Sort by timestamp descending
- Create StatsBar component:
  - Show total/active/completed/errored project counts
  - Show total tasks completed/remaining
  - Color-coded indicators

**Test cases:**

Renders:
- ErrorPanel renders list of errors → errors visible
- StatsBar renders all stat values → counts visible

Props:
- ErrorPanel shows file and line number for each error → file:line format
- StatsBar shows correct color for each stat (active=blue, completed=green, errored=red) → correct

Conditional rendering:
- ErrorPanel shows "No errors" when errors array empty → message shown
- StatsBar handles zero values gracefully → shows "0" not empty

Edge cases:
- ErrorPanel with error missing file/line fields → renders without crash

**Acceptance:** all tests pass, /verify green

---

## Task 18: Search and filter controls [size: medium]

**Files:** src/components/SearchFilter.tsx, src/app/page.tsx (update)

**Implementation:**
- Create SearchFilter component with:
  - Text search input (filters by project name)
  - Stage filter dropdown (all, pending, building, testing, complete, error)
- Integrate into dashboard homepage
- Client-side filtering (no API changes needed)

**Test cases:**

Renders:
- SearchFilter renders search input and stage dropdown → both visible

User interaction:
- Typing in search filters projects by name → filtered list
- Selecting stage filters projects by stage → filtered list
- Clearing search shows all projects → full list

Edge cases:
- Search is case-insensitive → matches regardless of case
- No matching results shows empty state → "No matching projects" message

**Acceptance:** all tests pass, /verify green

---

## Task 19: Register project UI flow [size: medium]

**Files:** src/components/RegisterProject.tsx, src/app/page.tsx (update)

**Implementation:**
- Create RegisterProject component:
  - Form with repoUrl input and optional branch input
  - Submit calls POST /api/projects
  - Show validation errors inline
  - On success, project appears in list (SWR revalidation)
  - Modal or collapsible panel UI

**Test cases:**

Renders:
- Register form renders with URL input and submit button → visible

User interaction:
- Submitting valid URL calls API and shows success → project added
- Submitting invalid URL shows validation error inline → error shown

Conditional rendering:
- Loading state shown while submitting → spinner/disabled button
- Success message shown after registration → confirmation visible

Edge cases:
- Submitting duplicate URL shows 409 error message → "already registered"

**Acceptance:** all tests pass, /verify green

---

## Task 20: Smoke test checkpoint 4 [size: small]

**Files:** tests/integration/smoke.test.ts (extend existing)

**Implementation:**
- Extend integration test covering tasks 16-19
- Test all UI components render correctly with various data states
- Test search/filter functionality
- Test register project flow end-to-end

**Test cases:**
- StagePipeline renders correct state for each stage value → all stages correct
- ErrorPanel renders errors and handles empty state → both cases work
- StatsBar renders with real aggregate data → accurate counts
- SearchFilter filters projects by name and stage → correct filtering
- RegisterProject form submits and project appears → end-to-end flow
- Entire flow completes without errors → passes

**Acceptance:** integration test passes, all previous tests pass

---

## Task 21: Self-review and cleanup [size: medium]

**Files:** README.md, any files needing cleanup

**Implementation:**
Run each check, fix failures:

Architecture:
- No circular dependencies
- No file exceeds 300 lines
- No function exceeds 50 lines
- All imports follow ARCHITECTURE.md rules

Consistency:
- All error responses match PROJECT.md format
- All endpoints use Zod validation
- API response fields are camelCase

Code hygiene:
- No console.log in source
- No commented-out code
- No unused imports
- No type escape hatches (no `any`, no `as unknown`, no `@ts-ignore`)

Deliverables:
- README.md: setup, install, run dev, run tests, env vars, API overview
- .env.example complete

**Test cases:**
- All checklist items pass
- /verify green
- Coverage 80%+

**Acceptance:** zero errors, PR created: `build/auto-railwy` → `main`

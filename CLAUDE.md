# CLAUDE.md — Build System Orchestration

> This project uses the Everything Claude Code (ECC) plugin for enforcement.
> ECC handles TDD, verification, quality gates, and code standards.
> This file defines: what to build, task protocol, and tracking.

---

## Setup

If ECC plugin is not already installed globally, run these first:

```
/plugin marketplace add affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code
```

Then read these files in order: PROJECT.md → TASKS.md → ARCHITECTURE.md

---

## Stage 1: Plan Validation

Before writing code, verify inputs are buildable:

- PROJECT.md has: tech stack with versions, all endpoints with request/response, all models with types, error format, env vars
- TASKS.md has: max 2 files per task, explicit test cases per task, smoke checkpoints every 5 tasks, self-review as final task
- ARCHITECTURE.md has: layers, import rules, naming conventions
- All tasks in sequence produce everything in PROJECT.md

Auto-fix minor issues (missing size tags, reorder). Write unfixable gaps to DECISIONS.md.
When valid: update STATUS.json → `"stage": "building"`, create branch `build/auto-railwy`.

---

## Stage 2: Task Loop

For every task in TASKS.md, follow this sequence:

```
1. Read task from TASKS.md
2. git merge origin/main  (pick up any upstream changes)
3. /tdd                    (write tests from specified cases, implement code)
4. /verify                 (build + typecheck + lint + all tests must pass)
5. If fail → fix → /verify again (max 10 attempts, then mark blocked)
6. /code-review            (quality check)
7. git add -A
8. git commit -m "feat(task-<NUMBER>): <what was built>"
   Example: git commit -m "feat(task-3): JWT token generation utility"
9. Update STATUS.json + mark task [x] in TASKS.md
10. git push origin build/auto-railwy
11. bash scripts/generate-codemap.sh
12. git add . && git commit -m "docs: task <NUMBER> tracking update" && git push
13. Next task
```

Use `/compact` between tasks if context feels heavy. Never during a task.

---

## Session Lifecycle

**First session:** You open Claude Code in the project directory. Read this file, validate the plan, start the task loop.

**Within a session:** Work through as many tasks as context allows (typically 5-7 micro-tasks). If context gets heavy after 5+ tasks, finish the current task, commit, and stop cleanly.

**Resuming in a new session:** Start with this:
```
Read CLAUDE.md and TASKS.md. Run the test suite to see current state.
Continue from the next unchecked task in TASKS.md.
```
The test suite tells you what's built and working. No other context recovery needed.

**For multi-session projects:** Each session picks up where the last left off. The pattern is always: read TASKS.md → run tests → continue. Repeat until all tasks are done.

---

## STATUS.json Protocol

Update `.status/STATUS.json` and commit at these events:

- Task starts → current_task, status: "coding"
- Tests written → status: "testing"
- Fix loop → status: "fixing", fix_attempt count
- Error → add to errors array (message, file, line, timestamp)
- Task done → status: "done", completed++, percentage, timestamps
- Task blocked → status: "blocked", reason in errors
- All done → stage: "complete"

---

## Rules

**You CANNOT change:**
- Tech stack, API contracts, DB schema, error format (PROJECT.md)
- Task order or test cases (TASKS.md)
- Layer rules (ARCHITECTURE.md)
- Coverage threshold (80%)

**When you assume something not in spec:**
- Write to DECISIONS.md: what, why, alternatives considered
- Add code comment: `// ASSUMPTION: [description]`

**Fix loop limits:**
- Attempts 1-5: fix based on error
- Attempts 6-8: try different approach
- Attempts 9-10: minimal viable implementation
- After 10: mark blocked in STATUS.json, move to next task
- Never comment out tests, never use type escape hatches, never disable lint rules

---

## Done When

1. Every task in TASKS.md marked `[x]`
2. `/verify` passes (zero errors)
3. Coverage 80%+
4. Self-review checklist passes (final task)
5. Smoke test passes
6. README.md + .env.example complete
7. PR created: `build/auto-railwy` → `main`
8. STATUS.json shows `"stage": "complete"`

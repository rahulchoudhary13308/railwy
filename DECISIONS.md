# Decisions Log

## 1. `description` column changed from `TEXT DEFAULT ''` to `TEXT` (nullable)

**Date:** 2026-04-04
**Reason:** `TEXT DEFAULT ''` is invalid SQL in MySQL 8.x strict mode — TEXT/BLOB columns cannot have default values. The migration would crash on production.
**Alternatives considered:**
- `VARCHAR(2000) NOT NULL DEFAULT ''` — changes column type, introduces 2000-char limit vs ~65KB for TEXT
- `TEXT DEFAULT ''` (keep as-is) — crashes on MySQL 8.x strict mode
- `TEXT` (nullable, no default) — preserves original type, removes invalid default ✅ chosen
**Mitigation:** `create()` passes `data.description ?? ''`, so NULL never enters the DB in practice. `rowToProject()` maps `null` to `''` as defense-in-depth.

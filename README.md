# Fitness 2.0

Personal training tracker for a 65-week tendon-first program.

**Kill criteria:** if no sessions are logged for 3 consecutive weeks while training, strip the app down or delete it.

---

## Phase 0 — Schema Migration

One-time idempotent script that adds new properties to the existing Workout Log data source and creates the Decisions and Inbox databases. Safe to re-run — existing properties and databases are never modified or deleted.

### Prerequisites

- Node.js ≥ 20
- A Notion internal integration (`ntn_...`) with read/write access to the Fitness 2.0 workspace

### Setup

```bash
cp .env.example .env
# Fill in NOTION_TOKEN in .env
npm install
```

### Run

```bash
npm run migrate
```

Expected output:

```
Fitness 2.0 — Phase 0: Schema Migration
=========================================
[1/4] Checking Workout Log data source...
      add   — Domain, Equipment, Set, Day Status, Cause, Fatigue, Client ID
      done  — added 7 properties
[2/4] Listing child databases under parent page...
      found N child database(s)
[3/4] Ensuring Decisions database...
      done  — "Decisions" created (xxxx)
[4/4] Ensuring Inbox database...
      done  — "Inbox" created (xxxx)

Migration complete.
```

Re-running after success prints `skip` for everything.

### What gets added

**Workout Log data source** (`1e4a21b8-585f-4f0a-879b-3dc65d2a3016`):

| Property | Type | Options |
|---|---|---|
| Domain | select | Gym, Home, Hotel, Outdoor |
| Equipment | select | Bodyweight, Dumbbell/KB, Machine/Cable, Barbell, Sandbag/Improvised, None |
| Set | number | set index within an exercise |
| Day Status | select | Full, Reduced, Chaos-absorption, Rest-on-signal |
| Cause | select | Work, Sleep, Travel, Signal, Other |
| Fatigue | number | 1–5 subjective; range enforced in UI (Phase 1) |
| Client ID | text | sync dedupe key; written by the app, not manually |

**Decisions database** (new, under parent page):

| Property | Type |
|---|---|
| Decision | title |
| Date made | created_time (auto) |
| What would change it | rich_text |
| Revisit date | date |
| Status | select: Active / Revisit due / Changed / Confirmed |
| Outcome note | rich_text |

**Inbox database** (new, under parent page):

| Property | Type |
|---|---|
| Text or URL | title |
| Type | select: Thought / Link / Quote |
| Principle tag | select: tendon-first / chaos / control-before-speed / timed-stiffness / mobility-over-load / other |
| Why it matters | rich_text (required when Type = Link — enforced in UI, Phase 3) |
| Week | number |
| Shareable | checkbox |

---

### Phase 0 decisions and assumptions

| Decision | Rationale |
|---|---|
| Raw `fetch`, no SDK | `@notionhq/client` v5 exists but the exact method signatures for `data_sources` were unverifiable without a local install. Raw `fetch` against the documented endpoints is deterministic. |
| `Notion-Version: 2025-09-03` | Matches the data source model already in use; newer versions may have undocumented breaking changes. |
| Idempotency via schema diff | Fetch current properties → add only missing keys. No overwrites, no deletes. |
| New databases found by listing page children | `GET /v1/blocks/{PAGE_ID}/children` → match by `child_database.title`. More reliable than search for a single-user setup. |
| `Fatigue` as number | Notion has no integer-constrained number type; 1–5 range enforced in Phase 1 UI. |
| `Why it matters` not marked required in schema | Notion doesn't support conditional required fields; enforced in Phase 3 Inbox form. |
| Rate limit: 10 req/sec | User confirmed Business/Enterprise plan. Sync proxy (Phase 1) throttles accordingly. |
| No backfill of existing rows | Spec says no backfill; new properties are null for all 671 existing rows. |

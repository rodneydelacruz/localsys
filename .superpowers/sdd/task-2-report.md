# Task 2 Report: Activity logging utility + auto-logging integration

## What was implemented

- **Created `src/api/activity.ts`** — core activity logging utility with:
  - `logActivity(action, collection, recordId, details)` — fire-and-forget function that logs to `activity_logs` collection with user context from `authStore`
  - `getActivities(page, perPage, sort)` — paginated query function for activity logs
  - Both exports the `ApiActivity` interface for type safety
  - `logActivity` is wrapped in try/catch with silent failure (logging never breaks main flow)

- **Modified `src/api/residents.ts`** — added `logActivity` call after each successful create/update/delete, using `result.first_name`/`result.last_name` in log messages

- **Modified `src/api/households.ts`** — same pattern, using `result.household_number` in log messages

- **Modified `src/api/documents.ts`** — same pattern, using `result.queue_number` in log messages

## What was tested

- `npm run build` (tsc + vite) — passed without errors

## Files changed

| File | Action |
|------|--------|
| `src/api/activity.ts` | Created (49 lines) |
| `src/api/residents.ts` | Modified (+6 lines, -2 lines) |
| `src/api/households.ts` | Modified (+6 lines, -1 line) |
| `src/api/documents.ts` | Modified (+6 lines, -1 line) |

## Self-review findings

- All `logActivity` calls are **fire-and-forget** (not awaited, inside try block after PB call, before return)
- All imports use relative path `'./activity'` matching existing import style
- Messages follow the brief exactly: create/update include identifiers, delete is static
- No circular dependencies — `activity.ts` depends on `client.ts`/`errorHandler.ts`, the three API files depend on `activity.ts`, no reverse dependency exists

## Issues or concerns

None.

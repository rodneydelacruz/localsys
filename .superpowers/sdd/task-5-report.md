# Task 5: Activity Log Viewer Page — Report

## What was implemented

- **`src/api/activity.ts`** — Added optional `collection` parameter to `getActivities()` that passes a PocketBase filter string when set.
- **`src/features/logs/ActivityPage.tsx`** — New read-only Activity Log viewer:
  - Fetches paginated data via `getActivities(page, 25, sort, collection?)`
  - Table columns: Action (badge with color-coded pills), Collection, Details, User, Timestamp
  - Sortable column headers (collection, user, timestamp) — click toggles asc/desc with arrow indicators
  - Collection filter `<Select>` dropdown (All Collections, residents, households, document_requests, blotter_records, visitor_logs)
  - "Load more" button appends the next page of results when `page < totalPages`
  - Sort or filter change resets to page 1 and replaces items
  - Empty state: "No activity recorded yet."
  - Loading skeleton matching existing page patterns
  - **Read-only** — no action buttons, no slide-over panel
- **`src/routes/index.tsx`** — Added `/activity-log` route under `ProtectedRoute` (roles: admin, staff, viewer)
- **`src/components/Sidebar.tsx`** — Added "Activity Log" nav item under Administration group with `Activity` icon
- **`src/features/logs/index.ts`** — Already exported `ActivityPage`, no change needed

## Build result

```
src/pages/Dashboard.tsx(4,47): error TS2307: Cannot find module '@/api/records'
src/pages/Dashboard.tsx(5,32): error TS2307: Cannot find module '@/api/records'
src/pages/Dashboard.tsx(30,47): error TS7006: Parameter 'err' implicitly has an 'any' type.
src/pages/Dashboard.tsx(35,24): error TS7006: Parameter 'all' implicitly has an 'any' type.
```

All 4 errors are pre-existing in `Dashboard.tsx` (missing `@/api/records` module). No new errors introduced.

## Files changed

| File | Change |
|------|--------|
| `src/api/activity.ts` | Added `collection` param to `getActivities()` |
| `src/features/logs/ActivityPage.tsx` | **Created** — full activity log page |
| `src/routes/index.tsx` | Added `/activity-log` route |
| `src/components/Sidebar.tsx` | Added Activity Log nav item |

## Self-review findings

- Collection filter uses PocketBase filter syntax (`collection = "residents"`) — values are from a controlled dropdown, no injection risk.
- Sort toggling follows spec: clicking same header toggles direction, clicking different header starts at ascending.
- Loading state shows skeleton during initial load; "Load more" button shows "Loading..." text while fetching next page.
- No side effects or slide-over panels — page is purely read-only.

## Issues or concerns

- The `getActivities` API doesn't natively support a collection filter — I added it with a PocketBase filter string. If PocketBase's filter syntax changes, this may need updating.
- The "Load more" button uses a native `<button>` styled to match outline variants, since using the project's `Button` component would add default icon/children patterns that are unnecessary here.

# Task 3 Report: Blotter API + Page Rewrite

## What was implemented

1. **Created `src/api/blotter.ts`** — Full CRUD API for the `blotter_records` collection:
   - `getBlotters()` — fetch all, sorted by `-incident_date`
   - `getBlotter(id)` — fetch single
   - `createBlotter(data)` — create with activity logging
   - `updateBlotter(id, data)` — update with activity logging
   - `deleteBlotter(id)` — delete with activity logging
   - `getNextCaseNumber()` — auto-generate `BLT-{year}-{seq}` (e.g., `BLT-2026-001`)
   - `getBlottersSummary()` — counts by status for dashboard use
   - Interfaces: `BlotterData` (input), `ApiBlotter` (response extending RecordModel)

2. **Rewrote `src/features/records/RecordsPage.tsx`** — Complete blotter case management page following ResidentsPage pattern:
   - Table columns: Case #, Complainant, Respondent, Incident Type, Status (badge), Date, Actions
   - Filter bar: text search (case # or names), status dropdown, incident type dropdown
   - Slide-over form panel with 4 fieldset sections:
     - **Case Info**: auto-generated case_number (read-only), incident_type (select), incident_date, incident_location
     - **Parties**: complainant_name* (required), complainant_contact, respondent_name, respondent_contact
     - **Details**: narrative (textarea), involved_parties (textarea)
     - **Resolution**: status (select), action_taken (textarea — shown when status is settled/escalated)
   - Status badge colors: pending=amber, hearing=blue, settled=emerald, escalated=orange, dismissed=red
   - Case number auto-generated on create (fetched via `getNextCaseNumber`)
   - Role-gated CRUD (admin/staff only; viewer read-only)
   - Empty state: "No blotter cases yet."
   - Loading skeleton, error handling, ConfirmDialog for delete

3. **Deleted `src/api/records.ts`** — The old records API is replaced by blotter.ts.

## Build result

**FAILED** — Expected. The Dashboard (`src/pages/Dashboard.tsx`) still imports `getRecords`, `getRecordsSummary`, and `ApiRecord` from `@/api/records`. The task brief explicitly noted this: "Don't worry about that — Task 6 will update the Dashboard." The build will pass once Task 6 updates the Dashboard to use `@/api/blotter`.

## Files changed

| File | Action |
|------|--------|
| `src/api/blotter.ts` | Created (new API module) |
| `src/features/records/RecordsPage.tsx` | Rewritten (full blotter management) |
| `src/api/records.ts` | Deleted (replaced by blotter.ts) |

## Self-review findings

- All form fields match the spec and migration schema
- `action_taken` conditionally appears for `settled` and `escalated` statuses only
- `case_number` is read-only in the form (auto-generated)
- The complainant_name field is required
- Status badges use the specified color scheme
- The page follows the ResidentsPage pattern closely: same filter bar layout, same table structure, same slide-over panel pattern, same ConfirmDialog
- The `getBlottersSummary()` function returns the new status set (pending, hearing, settled, escalated, dismissed) matching the migration; the old `getRecordsSummary()` returned (pending, approved, rejected)

## Issues or concerns

- **Build break**: The Dashboard (Task 6) must be updated to import from `@/api/blotter` instead of `@/api/records`. The Dashboard uses `getRecords()`, `getRecordsSummary()`, and `ApiRecord` — these need to be mapped to `getBlotters()`, `getBlottersSummary()`, and `ApiBlotter`, with the `statusConfig` updated to match the new status values.

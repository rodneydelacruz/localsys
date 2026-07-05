# Barangay System — Group C: Blotter Cases (Extended) + Activity Log + Visitor Log

## Overview

Three features completing the operational records domain:
1. Blotter Cases — extended from minimal title/status to full incident management
2. Activity Log — automatic global audit trail with paginated viewer
3. Visitor Log — barangay hall visitor check-in/out tracking

---

### PocketBase Collections

#### Collection: `blotter_records` (extended)

Extended from existing `blotter_records` schema.

| Field | Type | Rules |
|---|---|---|
| case_number | text | auto-generated "BLT-YYYY-XXX" |
| incident_type | select | blotter / complaint / dispute / other |
| complainant_name | text | required |
| complainant_contact | text | |
| respondent_name | text | |
| respondent_contact | text | |
| incident_date | date | |
| incident_location | text | |
| narrative | text | long text |
| status | select | pending / hearing / settled / escalated / dismissed |
| action_taken | text | |
| involved_parties | text | |
| created_by | relation → users | |

Existing `title` and `approved/rejected` statuses are replaced — the migration will override the schema.

**Indexes**: `case_number` (unique), `status`, `incident_date`

---

#### Collection: `activity_logs`

| Field | Type | Rules |
|---|---|---|
| action | text | required — "create" / "update" / "delete" |
| collection | text | required — collection name |
| record_id | text | the affected record ID |
| details | text | human-readable description |
| user_name | text | denormalized who performed the action |
| created | autodate | auto timestamp |

**Indexes**: `created` (for sorted pagination), `collection`

**Rules**: CreateRule = authenticated (admin/staff), List/ViewRule = authenticated, no update/delete (immutable log)

---

#### Collection: `visitor_logs`

| Field | Type | Rules |
|---|---|---|
| visitor_name | text | required |
| contact_number | text | |
| purpose | text | required |
| person_to_visit | text | |
| time_in | autodate | set on create |
| time_out | date | set on check-out (nullable) |

**Indexes**: `time_in`, `time_out`

**Rules**: admin + staff full CRUD

---

### API Layer

#### `src/api/blotter.ts`

Replace existing `src/api/records.ts` with a new `blotter.ts`:

```typescript
interface BlotterData {
  case_number?: string
  incident_type: string
  complainant_name: string
  complainant_contact?: string
  respondent_name?: string
  respondent_contact?: string
  incident_date?: string
  incident_location?: string
  narrative?: string
  status?: string
  action_taken?: string
  involved_parties?: string
}

interface ApiBlotter extends RecordModel, BlotterData {
  created_by: string
  updated: string
}

// getBlotters(), getBlotter(id), createBlotter(data), updateBlotter(id, data), deleteBlotter(id)
// getNextCaseNumber() — generates "BLT-YYYY-XXX"
// getBlottersSummary() — counts by status
```

Route stays `/records`, but internal implementation uses `blotter.ts`.

**Replace** `src/api/records.ts` with the new `src/api/blotter.ts`. Update imports in:
- `src/features/records/RecordsPage.tsx` → uses new `blotter.ts`
- `src/pages/Dashboard.tsx` → uses new `blotter.ts` for summary and recent items

---

#### `src/api/activity.ts`

```typescript
export async function logActivity(action: string, collection: string, recordId: string, details: string): Promise<void>
export async function getActivities(page: number, perPage: number, sort?: string): Promise<{ items: ApiActivity[]; totalItems: number; totalPages: number }>

interface ApiActivity extends RecordModel {
  action: string
  collection: string
  record_id: string
  details: string
  user_name: string
  created: string
}
```

`logActivity()` reads `getClient().authStore.model` for user info, auto-sets `user_name` and `created`.

**Auto-logging integration**: modify the following existing API files to call `logActivity()` after every successful create/update/delete:

| File | Functions to log |
|---|---|
| `src/api/residents.ts` | createResident, updateResident, deleteResident |
| `src/api/households.ts` | createHousehold, updateHousehold, deleteHousehold |
| `src/api/documents.ts` | createDocument, updateDocument, deleteDocument |
| `src/api/blotter.ts` | createBlotter, updateBlotter, deleteBlotter |
| `src/api/visitors.ts` | createVisitor, updateVisitor, deleteVisitor |

---

#### `src/api/visitors.ts`

Standard CRUD for visitor_logs:

```typescript
interface VisitorData {
  visitor_name: string
  contact_number?: string
  purpose: string
  person_to_visit?: string
  time_out?: string
}

interface ApiVisitor extends RecordModel, VisitorData {
  time_in: string
  time_out: string
  updated: string
}

// getVisitors(), getVisitor(id), createVisitor(data), updateVisitor(id, data), deleteVisitor(id)
// checkOutVisitor(id) — sets time_out to now
```

---

### UI Components

#### Blotter Cases Page (`/records`)

Replace existing RecordsPage — fully rewritten with:

**List**: Table with columns Case #, Complainant, Respondent, Incident Type, Status (colored badge), Date, Actions

**Filters**: Text search (case #, names), status dropdown, incident type dropdown

**Form** (slide-over panel):
- Case Info: Case # (auto), Incident Type (select), Incident Date, Location
- Parties: Complainant Name*, Contact, Respondent Name, Contact
- Details: Narrative (textarea), Involved Parties
- Resolution: Status, Action Taken (shown when status = settled/escalated)

**Default values**: status = "pending", incident_type = "blotter"

---

#### Activity Log Page (`/logs/activity`)

Read-only table with pagination:

**List**: Table with columns Action (create/update/delete badge), Collection, Details, User, Timestamp

**Features**:
- Sortable by timestamp (default desc), collection, action
- "Load more" button at bottom (paginated via getList, 25 per page)
- No create/edit/delete — view-only

**Empty state**: "No activity recorded yet."

---

#### Visitor Log Page (`/logs/visitors`)

**List**: Table with columns Visitor Name, Contact, Purpose, Person to Visit, Time In, Time Out, Actions

**Filters**: Text search (name, purpose), date range (time_in), show only active (time_out = null)

**Form** (slide-over):
- Visitor Name*, Contact, Purpose*, Person to Visit

**Check-out action**: Inline "Check Out" button for visitors with no time_out set. Sets time_out to now. Once checked out, shows time_out timestamp.

---

### Routes

| Route | Feature | Roles |
|---|---|---|
| `/records` | Blotter Cases (extended) | admin, staff, viewer |
| `/logs/activity` | Activity Log | admin, staff |
| `/logs/visitors` | Visitor Log | admin, staff |

---

### Sidebar

Add **Logs** nav group after Records group:
- **Records** → Blotter Records
- **Logs** → Activity Log, Visitor Log

(Existing "Records" group relabeled or kept as-is with Blotter Records only.)

---

### Implementation Order

1. Create activity logging utility (`src/api/activity.ts`)
2. Modify all existing API files to auto-log via `logActivity()`
3. Create migration JSON for all three collections
4. Rewrite `src/api/records.ts` → `src/api/blotter.ts` (replace)
5. Create `src/api/visitors.ts`
6. Rewrite `src/features/records/RecordsPage.tsx` (extension)
7. Create `src/features/logs/ActivityPage.tsx`
8. Create `src/features/logs/VisitorLogPage.tsx`
9. Update `src/pages/Dashboard.tsx` to use blotter API
10. Update routes and sidebar

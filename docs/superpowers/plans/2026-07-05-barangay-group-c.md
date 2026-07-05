# Group C: Blotter Cases + Activity Log + Visitor Log — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend blotter records with full incident fields, add automatic global audit logging, and add visitor check-in/out tracking.

**Architecture:** Single PocketBase migration for 3 collections; lightweight `logActivity()` utility called from existing API files; new Blotter API replaces old records API; Dashboard updated to use new blotter summary; paginated read-only activity log viewer.

**Tech Stack:** PocketBase SDK (`getClient()`), React + TypeScript, tailwind CSS, lucide-react

## Global Constraints

- Zero new JS dependencies beyond existing package.json
- No animation JS libraries; CSS-only motion utilities (transform/opacity)
- `prefers-reduced-motion` respected via existing CSS
- Filipino palette: capiz, gold, narra, bamboo, red-pinoy, barangay
- Dark mode base `#12100E`
- All pages responsive: mobile bottom-drawer panels, desktop slide-over panels
- `cn()` utility from `@/lib/utils` for conditional classes
- `hasRole()` from `@/auth/session` for role gating
- PocketBase migration JSON files for collection schemas
- Subagent-driven development: fresh subagent per task, task review, whole-branch review + fix pass

## File Structure

| File | Status | Purpose |
|---|---|---|
| `pocketbase/migrations/003_blotter_activity_visitors.json` | Create | 3 collection schemas |
| `src/api/activity.ts` | Create | logActivity utility + paginated reader |
| `src/api/blotter.ts` | Create | Replaces records.ts — full blotter CRUD |
| `src/api/visitors.ts` | Create | Visitor CRUD + check-out |
| `src/api/residents.ts` | Modify | Add logActivity calls |
| `src/api/households.ts` | Modify | Add logActivity calls |
| `src/api/documents.ts` | Modify | Add logActivity calls |
| `src/features/records/RecordsPage.tsx` | Rewrite | Full blotter form + table |
| `src/features/logs/ActivityPage.tsx` | Create | Paginated read-only viewer |
| `src/features/logs/VisitorLogPage.tsx` | Create | Visitor CRUD with check-out |
| `src/features/logs/index.ts` | Create | Exports |
| `src/pages/Dashboard.tsx` | Modify | Use blotter API instead of records API |
| `src/routes/index.tsx` | Modify | Add /logs/activity, /logs/visitors |
| `src/components/Sidebar.tsx` | Modify | Add Logs nav group |
| `src/api/records.ts` | Delete | Replaced by blotter.ts |

---

### Task 1: PocketBase migration JSON

**Files:**
- Create: `pocketbase/migrations/003_blotter_activity_visitors.json`

**Interfaces:**
- Produces: `blotter_records`, `activity_logs`, `visitor_logs` collections

- [ ] **Step 1: Create migration JSON**

```json
[
  {
    "name": "blotter_records",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "case_number", "type": "text", "required": true, "options": { "max": 20 } },
      { "name": "incident_type", "type": "select", "required": true, "options": { "values": ["blotter", "complaint", "dispute", "other"] } },
      { "name": "complainant_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "complainant_contact", "type": "text", "options": { "max": 20 } },
      { "name": "respondent_name", "type": "text", "options": { "max": 255 } },
      { "name": "respondent_contact", "type": "text", "options": { "max": 20 } },
      { "name": "incident_date", "type": "date" },
      { "name": "incident_location", "type": "text", "options": { "max": 500 } },
      { "name": "narrative", "type": "text", "options": { "max": 5000 } },
      { "name": "status", "type": "select", "required": true, "options": { "values": ["pending", "hearing", "settled", "escalated", "dismissed"] } },
      { "name": "action_taken", "type": "text", "options": { "max": 2000 } },
      { "name": "involved_parties", "type": "text", "options": { "max": 2000 } },
      { "name": "created_by", "type": "relation", "options": { "collectionId": "", "maxSelect": 1 } }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_blotter_case_number ON blotter_records (case_number)",
      "CREATE INDEX idx_blotter_status ON blotter_records (status)",
      "CREATE INDEX idx_blotter_date ON blotter_records (incident_date)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  },
  {
    "name": "activity_logs",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "action", "type": "text", "required": true, "options": { "max": 20 } },
      { "name": "collection", "type": "text", "required": true, "options": { "max": 50 } },
      { "name": "record_id", "type": "text", "options": { "max": 50 } },
      { "name": "details", "type": "text", "options": { "max": 2000 } },
      { "name": "user_name", "type": "text", "options": { "max": 255 } },
      { "name": "created", "type": "autodate", "options": { "when": "create" } }
    ],
    "indexes": [
      "CREATE INDEX idx_activity_created ON activity_logs (created)",
      "CREATE INDEX idx_activity_collection ON activity_logs (collection)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": null,
    "deleteRule": null
  },
  {
    "name": "visitor_logs",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "visitor_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "contact_number", "type": "text", "options": { "max": 20 } },
      { "name": "purpose", "type": "text", "required": true, "options": { "max": 2000 } },
      { "name": "person_to_visit", "type": "text", "options": { "max": 255 } },
      { "name": "time_in", "type": "autodate", "options": { "when": "create" } },
      { "name": "time_out", "type": "date" }
    ],
    "indexes": [
      "CREATE INDEX idx_visitor_time_in ON visitor_logs (time_in)",
      "CREATE INDEX idx_visitor_time_out ON visitor_logs (time_out)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  }
]
```

---

### Task 2: Activity logging utility + auto-logging integration

**Files:**
- Create: `src/api/activity.ts`
- Modify: `src/api/residents.ts`, `src/api/households.ts`, `src/api/documents.ts`

**Interfaces:**
- Consumes: `getClient()` from `@/api/client`
- Produces: `logActivity(action, collection, recordId, details)` — called after every create/update/delete across all API files

- [ ] **Step 1: Create `src/api/activity.ts`**

```typescript
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { RecordModel } from 'pocketbase'

export interface ApiActivity extends RecordModel {
  action: string
  collection: string
  record_id: string
  details: string
  user_name: string
  created: string
}

export async function logActivity(
  action: 'create' | 'update' | 'delete',
  collection: string,
  recordId: string,
  details: string,
): Promise<void> {
  try {
    const user = getClient().authStore.model as { name?: string; email?: string } | null
    await getClient().collection('activity_logs').create({
      action,
      collection,
      record_id: recordId,
      details,
      user_name: user?.name ?? user?.email ?? 'System',
    })
  } catch {
    // Silently fail — logging never breaks main operations
  }
}

export async function getActivities(
  page = 1,
  perPage = 25,
  sort = '-created',
): Promise<{ items: ApiActivity[]; totalItems: number; totalPages: number }> {
  try {
    const result = await getClient().collection('activity_logs').getList<ApiActivity>(page, perPage, { sort })
    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    }
  } catch (err) {
    throw handleApiError(err)
  }
}
```

- [ ] **Step 2: Add logging to `src/api/residents.ts`**

Add import and calls after each successful create/update/delete:

```typescript
import { logActivity } from './activity'

export async function createResident(data: ResidentData): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiResident>(data)
    logActivity('create', COLLECTION, result.id, `Created resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateResident(id: string, data: Partial<ResidentData>): Promise<ApiResident> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiResident>(id, data)
    logActivity('update', COLLECTION, id, `Updated resident: ${result.first_name} ${result.last_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteResident(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted resident`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
```

- [ ] **Step 3: Add logging to `src/api/households.ts`**

Add import and calls — same pattern as residents. Log messages use `result.household_number` for create/update, static for delete.

- [ ] **Step 4: Add logging to `src/api/documents.ts`**

Add import and calls — same pattern. Log messages use queue_number.

---

### Task 3: Blotter API + page rewrite

**Files:**
- Create: `src/api/blotter.ts`
- Rewrite: `src/features/records/RecordsPage.tsx`
- Delete: `src/api/records.ts`

**Interfaces:**
- Consumes: `logActivity` from `./activity`, `getClient` from `./client`
- Produces: `getBlotters()`, `getBlotter()`, `createBlotter()`, `updateBlotter()`, `deleteBlotter()`, `getNextCaseNumber()`, `getBlottersSummary()`

- [ ] **Step 1: Create `src/api/blotter.ts`**

```typescript
import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'

const COLLECTION = 'blotter_records'

export interface BlotterData {
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

export interface ApiBlotter extends RecordModel {
  case_number: string
  incident_type: string
  complainant_name: string
  complainant_contact: string
  respondent_name: string
  respondent_contact: string
  incident_date: string
  incident_location: string
  narrative: string
  status: string
  action_taken: string
  involved_parties: string
  created_by: string
  updated: string
}

export async function getBlotters(): Promise<ApiBlotter[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiBlotter>({ sort: '-incident_date' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getBlotter(id: string): Promise<ApiBlotter> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiBlotter>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createBlotter(data: BlotterData): Promise<ApiBlotter> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiBlotter>(data)
    logActivity('create', COLLECTION, result.id, `Created blotter case: ${result.case_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateBlotter(id: string, data: Partial<BlotterData>): Promise<ApiBlotter> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiBlotter>(id, data)
    logActivity('update', COLLECTION, id, `Updated blotter case: ${result.case_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteBlotter(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted blotter case`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getNextCaseNumber(): Promise<string> {
  try {
    const year = new Date().getFullYear()
    const existing = await getClient().collection(COLLECTION).getFullList<ApiBlotter>({
      filter: `case_number ~ 'BLT-${year}-'`,
      requestKey: 'next-case-number',
    })
    const max = existing.reduce((maxN, b) => {
      const parts = b.case_number.split('-')
      const num = parseInt(parts[2] || '0', 10)
      return num > maxN ? num : maxN
    }, 0)
    return `BLT-${year}-${String(max + 1).padStart(3, '0')}`
  } catch {
    return `BLT-${new Date().getFullYear()}-001`
  }
}

export async function getBlottersSummary(): Promise<{ total: number; pending: number; hearing: number; settled: number; escalated: number; dismissed: number }> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiBlotter>({ requestKey: 'blotter-summary' })
    return {
      total: all.length,
      pending: all.filter((b) => b.status === 'pending').length,
      hearing: all.filter((b) => b.status === 'hearing').length,
      settled: all.filter((b) => b.status === 'settled').length,
      escalated: all.filter((b) => b.status === 'escalated').length,
      dismissed: all.filter((b) => b.status === 'dismissed').length,
    }
  } catch {
    return { total: 0, pending: 0, hearing: 0, settled: 0, escalated: 0, dismissed: 0 }
  }
}
```

- [ ] **Step 2: Rewrite `src/features/records/RecordsPage.tsx`**

Key specs:
- import from `@/api/blotter` instead of `@/api/records`
- Table columns: Case #, Complainant, Respondent, Incident Type, Status (badge), Date, Actions
- Filters: search (case # or names), status dropdown, incident type dropdown
- Form (slide-over panel): Case Info section (auto case #, incident type select, incident date, location), Parties section (complainant name/contact, respondent name/contact), Details section (narrative textarea, involved parties), Resolution section (status, action taken — shown when status is settled/escalated)
- Status badge colors: pending=amber, hearing=blue, settled=emerald, escalated=orange, dismissed=red
- Case number auto-generated on create, shown read-only on edit
- Role-gated CRUD (viewer = read-only)
- Empty state: "No blotter cases yet."

- [ ] **Step 3: Delete `src/api/records.ts`**

Remove the file since `blotter.ts` replaces it.

---

### Task 4: Visitors API + page

**Files:**
- Create: `src/api/visitors.ts`
- Create: `src/features/logs/VisitorLogPage.tsx`
- Create: `src/features/logs/index.ts`

**Interfaces:**
- Consumes: `logActivity` from `./activity`
- Produces: standard CRUD + `checkOutVisitor(id)`

- [ ] **Step 1: Create `src/api/visitors.ts`**

```typescript
import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'

const COLLECTION = 'visitor_logs'

export interface VisitorData {
  visitor_name: string
  contact_number?: string
  purpose: string
  person_to_visit?: string
  time_out?: string
}

export interface ApiVisitor extends RecordModel {
  visitor_name: string
  contact_number: string
  purpose: string
  person_to_visit: string
  time_in: string
  time_out: string
  updated: string
}

export async function getVisitors(): Promise<ApiVisitor[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiVisitor>({ sort: '-time_in' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getVisitor(id: string): Promise<ApiVisitor> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiVisitor>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createVisitor(data: VisitorData): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiVisitor>(data)
    logActivity('create', COLLECTION, result.id, `Visitor logged in: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateVisitor(id: string, data: Partial<VisitorData>): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, data)
    logActivity('update', COLLECTION, id, `Updated visitor: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteVisitor(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted visitor log`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function checkOutVisitor(id: string): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, {
      time_out: new Date().toISOString(),
    })
    logActivity('update', COLLECTION, id, `Visitor checked out: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}
```

- [ ] **Step 2: Create `src/features/logs/VisitorLogPage.tsx`**

Key specs:
- Follows ResidentsPage pattern: table + slide-over form + ConfirmDialog
- Table columns: Visitor Name, Contact, Purpose, Person to Visit, Time In, Time Out, Actions
- Search filter: by name or purpose
- "Show active only" toggle (filters visitors with no time_out)
- Create/edit form: Visitor Name*, Contact, Purpose*, Person to Visit
- Inline "Check Out" button for visitors without time_out (sets time_out to now)
- Once checked out, show time_out timestamp
- Empty state: "No visitors logged yet."

- [ ] **Step 3: Create `src/features/logs/index.ts`**

```typescript
export { default as ActivityPage } from './ActivityPage'
export { default as VisitorLogPage } from './VisitorLogPage'
```

---

### Task 5: Activity log viewer page

**Files:**
- Create: `src/features/logs/ActivityPage.tsx`

**Interfaces:**
- Consumes: `getActivities` from `@/api/activity`

- [ ] **Step 1: Create `src/features/logs/ActivityPage.tsx`**

Key specs:
- Import `getActivities`, `type ApiActivity` from `@/api/activity`
- State: `activities: ApiActivity[]`, `page`, `totalPages`, `loading`, `sortBy`, `collectionFilter`
- On mount, fetch page 1 with default sort `-created`
- Table columns: Action (badge: create/update/delete), Collection, Details, User, Timestamp
- Sort controls: click on collection, user, timestamp headers to re-sort (pass sort param to getActivities)
- "Load more" button at bottom when `page < totalPages`
- Clicking "Load more" adds next page's items to the list (append, not replace)
- Collection filter: select dropdown with options for all collections
- Read-only: no create/edit/delete buttons at all
- Empty state: "No activity recorded yet."
- Action badge colors: create=emerald, update=blue, delete=red

---

### Task 6: Dashboard update

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `getBlotters`, `getBlottersSummary` from `@/api/blotter`

- [ ] **Step 1: Update imports and data fetching**

Replace:
```typescript
import { getRecords, getRecordsSummary } from '@/api/records'
import type { ApiRecord } from '@/api/records'
```
With:
```typescript
import { getBlotters, getBlottersSummary, type ApiBlotter } from '@/api/blotter'
```

Replace `getRecordsSummary` calls with `getBlottersSummary`.
Update stat cards to show blotter statuses (pending, hearing, settled, escalated, dismissed) instead of pending/approved/rejected.
Update recent records to show blotter entries.
Update statusConfig to use blotter statuses.

---

### Task 7: Routes + sidebar

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update routes**

Add imports:
```typescript
import { ActivityPage, VisitorLogPage } from '@/features/logs'
```

Add routes inside the ProtectedRoute layout:
```typescript
<Route
  path="logs/activity"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <ActivityPage />
    </ProtectedRoute>
  }
/>
<Route
  path="logs/visitors"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <VisitorLogPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Update sidebar**

Add `ClipboardCheck, DoorOpen` to lucide-react imports.

Add Logs nav group after Records:
```typescript
{
  label: 'Logs',
  items: [
    { to: '/logs/activity', label: 'Activity Log', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    { to: '/logs/visitors', label: 'Visitor Log', icon: DoorOpen, roles: ['admin', 'staff'] },
  ],
},
```

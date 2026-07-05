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


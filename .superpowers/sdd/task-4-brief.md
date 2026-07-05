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


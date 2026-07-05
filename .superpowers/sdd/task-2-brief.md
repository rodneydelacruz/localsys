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


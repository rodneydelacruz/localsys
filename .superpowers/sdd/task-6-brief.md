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


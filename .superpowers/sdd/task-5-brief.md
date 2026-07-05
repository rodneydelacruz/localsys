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


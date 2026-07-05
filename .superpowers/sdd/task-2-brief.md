### Task 2: Layout & Sidebar Refactoring

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Refactor Layout.tsx to use CSS grid**

Replace the entire component in `src/components/Layout.tsx`:

```tsx
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import Sidebar from '@/components/Sidebar'
import OfflineIndicator from '@/offline/OfflineIndicator'

const STORAGE_KEY = 'barangay-sidebar-pinned'

export default function Layout() {
  const [pinned, setPinned] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })
  const location = useLocation()

  function togglePinned() {
    setPinned((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <div className="grid min-h-screen grid-cols-[auto_1fr]">
      <Sidebar pinned={pinned} onTogglePin={togglePinned} />
      <main className="flex min-w-0 flex-col">
        <div key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 motion-fade-in motion-slide-up">
          <Outlet />
        </div>
        <OfflineIndicator />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Refactor Sidebar.tsx — replace body overflow toggling with HTML class**

In `src/components/Sidebar.tsx`, remove the existing `useEffect` for body scroll (lines 67-74 in original code) and replace with:

```tsx
  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => { document.documentElement.classList.remove('overflow-hidden') }
  }, [mobileOpen])
```

- [ ] **Step 3: Sidebar — update active indicator to use CSS transition**

Replace the `ActiveDot` function. Change from the current implementation to:

```tsx
function ActiveDot() {
  return (
    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-gold transition-all duration-200" />
  )
}
```

- [ ] **Step 4: Sidebar — use motion-fade-in for mobile overlay**

Add `motion-fade-in` to the backdrop overlay div class name.

- [ ] **Step 5: Sidebar — refactor user section (condensed in collapsed mode)**

Replace the entire user section block (the part that renders user info and logout button) with a unified version that shows:
- In pinned mode: avatar + name + role + logout button
- In collapsed mode: avatar + logout button (without the duplicate conditional)

**Verification:** Run `npm run dev`. Sidebar should render, pin/unpin works, mobile drawer opens, grid layout replaces spacer div. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.tsx src/components/Sidebar.tsx
git commit -m "feat(layout): CSS grid layout, sidebar refinements, motion utilities"
```

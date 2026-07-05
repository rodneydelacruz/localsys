# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the Barangay System frontend with a refined design system, CSS-only micro-animations, and better low-end device performance.

**Architecture:** All changes are CSS-first — animation utilities via Tailwind 4 `@utility`, design tokens via `@theme`, zero new JS dependencies. Components get restructured layout, refined spacing, and utility-based motion classes.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Vite 8, PocketBase

## Global Constraints

- Zero new JavaScript dependencies
- All animations use only `transform` and `opacity` (GPU-composited)
- Reduced motion respected via `prefers-reduced-motion` on all animations
- Dark mode base warmed from `#0B0A09` to `#12100E`
- Filipino-named color tokens (`--color-capiz`, `--color-barangay`, `--color-gold`, `--color-narra`, `--color-bamboo`, `--color-red-pinoy`) preserved as-is

---

### Task 1: Design Tokens & Animation Utility Foundation

**Files:**
- Modify: `src/index.css` (full file)

- [ ] **Step 1: Add surface and text tokens to `@theme` block**

Add these lines inside the existing `@theme` block (after line 23, before the Filipino color tokens):

```css
  --color-surface-raised: var(--surface-raised);
  --color-surface-overlay: var(--surface-overlay);
  --color-text-subtle: var(--text-subtle);
```

- [ ] **Step 2: Define new custom properties in `:root`**

Add inside `:root` after line 130 (`--red-pinoy: #CE1126;`):

```css
  --surface-raised: #FFFFFF;
  --surface-overlay: rgba(0, 0, 0, 0.4);
  --text-subtle: #A09688;
```

- [ ] **Step 3: Define dark mode overrides for new tokens**

Add inside `.dark` after line 161 (`--red-pinoy: #D94A45;`):

```css
  --surface-raised: #1C1917;
  --surface-overlay: rgba(0, 0, 0, 0.6);
  --text-subtle: #7A7064;
```

- [ ] **Step 4: Warm dark mode base**

Change line 136 in `.dark` from `--bg: #0B0A09;` to `--bg: #12100E;`.

- [ ] **Step 5: Remove universal transition, replace with targeted selector**

Replace lines 87-91 (the `*, *::before, *::after { transition: ... }` block) with:

```css
a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
    transition: none;
  }
}
```

- [ ] **Step 6: Replace animation keyframes with `@utility` motion classes**

Remove lines 35-85 (the `--animate-*` definitions in `@theme`, all `@keyframes`, `.theme-icon-enter`, and the old `@media (prefers-reduced-motion: reduce)` block). Add after the `@theme` block:

```css
@utility motion-fade-in {
  animation: motion-fade-in 0.3s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-slide-up {
  animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-scale-in {
  animation: motion-scale-in 0.2s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-lift {
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

@utility motion-press {
  &:active {
    transform: scale(0.97);
  }
}

@utility motion-stagger-50 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 50ms);
    }
  }
}

@utility motion-stagger-75 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 75ms);
    }
  }
}

@utility motion-stagger-100 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 100ms);
    }
  }
}

@keyframes motion-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes motion-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes motion-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 7: Preserve the `.theme-icon-enter` utility for theme toggle**

Add this after the `@keyframes` block:

```css
@keyframes theme-swirl {
  from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

.theme-icon-enter {
  animation: theme-swirl 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

- [ ] **Step 8: Clean up leftover reduced-motion block**

Remove lines 184-188 (the second `@media (prefers-reduced-motion: reduce)` around body transition) — body already has a specific transition with its own reduced-motion check on line 181-182.

**Verification:** Run `npm run build` and confirm no errors. The CSS file should compile cleanly with new utilities available.

- [ ] **Step 9: Commit**

```bash
git add src/index.css
git commit -m "feat(design): add design tokens, animation utilities, warm dark mode"
```

---

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

In `src/components/Sidebar.tsx`, replace the `useEffect` for mobile body scroll locking (lines 67-74):

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

Replace the `ActiveDot` component and its usage. Change the `ActiveDot` function (lines 46-48) to:

```tsx
function ActiveDot() {
  return (
    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-gold transition-all duration-200" />
  )
}
```

- [ ] **Step 4: Sidebar — use motion-slide-up for mobile overlay**

In the mobile backdrop overlay (around line 252-258), add `motion-fade-in` to the backdrop div:

```tsx
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 motion-fade-in md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
```

- [ ] **Step 5: Sidebar — refactor user section (condensed in collapsed mode)**

Replace the entire user section (lines 203-246) with:

```tsx
            {user && (
              <div className={cn(
                'flex',
                pinned ? 'items-center gap-2' : 'flex-col items-center gap-2',
              )}>
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                  title={user.name ?? user.email}
                >
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
                {pinned && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{user.name ?? user.email}</p>
                      <p className="truncate text-[11px] text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                      aria-label="Logout"
                      title="Logout"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </>
                )}
                {!pinned && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="size-4" />
                  </button>
                )}
              </div>
            )}
```

**Verification:** Run `npm run dev`. Sidebar should render, pin/unpin works, mobile drawer opens, grid layout replaces spacer div. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.tsx src/components/Sidebar.tsx
git commit -m "feat(layout): CSS grid layout, sidebar refinements, motion utilities"
```

---

### Task 3: UI Primitive Components Refresh

**Files:**
- Modify: `src/components/ThemeToggle.tsx`
- Modify: `src/components/ui/ConfirmDialog.tsx`
- Modify: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: ThemeToggle — add motion-scale-in for icon swap**

In `src/components/ThemeToggle.tsx`, wrap the icon in a `motion-scale-in` div or add the class directly. Replace the button content (lines 14-18):

```tsx
      {theme === 'light' ? (
        <Moon key="moon" className="size-3.5" />
      ) : (
        <Sun key="sun" className="size-3.5" />
      )}
```

(The key-based React reconciliation already provides the animation effect via CSS transitions. No change needed beyond verifying it works.)

- [ ] **Step 2: ConfirmDialog — add motion utilities**

In `src/components/ui/ConfirmDialog.tsx`:

Line 62: Change `className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"` to:
```tsx
        className="fixed inset-0 bg-black/40 backdrop-blur-sm motion-fade-in"
```

Line 72: Change `className={cn('relative w-full max-w-sm animate-scale-in rounded-lg border bg-card shadow-lg',` to:
```tsx
          className={cn('relative w-full max-w-sm motion-scale-in rounded-lg border bg-card shadow-lg',
```

- [ ] **Step 3: PageHeader — use motion utility**

In `src/components/ui/PageHeader.tsx`, line 11: Change `className="mb-6 animate-fade-in"` to `className="mb-6 motion-fade-in"`.

**Verification:** Run dev server, trigger a confirm dialog (delete record), verify it scales in. Check page headers don't flicker.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeToggle.tsx src/components/ui/ConfirmDialog.tsx src/components/ui/PageHeader.tsx
git commit -m "feat(ui): update primitives with motion utilities"
```

---

### Task 4: Login Page Redesign

**Files:**
- Modify: `src/auth/LoginPage.tsx`

- [ ] **Step 1: Add radial gradient background and refined card**

Replace the entire component in `src/auth/LoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { login } from './session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang Umaga'
  if (hour < 18) return 'Magandang Hapon'
  return 'Magandang Gabi'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeting] = useState(getGreeting)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-capiz px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--gold)_6%,transparent)_0%,transparent_70%)]" aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center motion-scale-in">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/5">
            <span className="text-2xl font-bold tracking-tight text-gold">B</span>
          </div>
        </div>

        <div className="mt-5 text-center motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-sm font-medium tracking-[0.15em] text-narra uppercase">
            {greeting}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-gold/60" aria-hidden="true" />
        </div>

        <div className="mt-8 motion-fade-in motion-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="rounded-2xl border border-bamboo bg-card p-6 shadow-sm ring-1 ring-transparent transition-shadow duration-200 focus-within:shadow-md focus-within:ring-gold/20 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@barangay.gov.ph"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="text-base"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-pinoy/20 bg-red-pinoy/5 px-3.5 py-2.5 text-sm text-red-pinoy motion-scale-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 text-base transition-all duration-200"
                style={{ width: loading ? '10rem' : undefined }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/30 motion-fade-in" style={{ animationDelay: '400ms' }}>
          Barangay System
        </p>
      </div>
    </div>
  )
}
```

**Verification:** Navigate to `/login`. Check greeting with gold underline, card has rounded-2xl corners, radial gradient visible on background, staggered animations, focus-within ring glow on card.

- [ ] **Step 2: Commit**

```bash
git add src/auth/LoginPage.tsx
git commit -m "feat(login): redesigned with gradient, rounded card, staggered motion"
```

---

### Task 5: Dashboard Implementation

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement dashboard with stat cards, recent activity, quick actions**

Create API helper to get counts (add to existing `src/api/records.ts` at the end):

```typescript
export async function getRecordsSummary(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
  try {
    const client = getClient()
    const all = await client.collection(COLLECTION).getFullList<ApiRecord>({ requestKey: 'records-summary' })
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      approved: all.filter((r) => r.status === 'approved').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    }
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}
```

Replace the entire `src/pages/Dashboard.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { getRecordsSummary } from '@/api/records'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecordsSummary().then(setStats).finally(() => setLoading(false))
  }, [])

  const statCards: Stat[] = [
    { label: 'Total Records', value: stats?.total ?? 0, icon: FileText, color: 'text-barangay' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: XCircle, color: 'text-red-pinoy' },
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of barangay records and system activity" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 motion-stagger-75" style={{ ['--stagger-index' as string]: 0 }}>
          {statCards.map((stat, i) => (
            <Card key={stat.label} className="overflow-hidden motion-lift" style={{ ['--stagger-index' as string]: i }}>
              <div className="h-1 w-full bg-gold/60" />
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <stat.icon className={cn('size-5 shrink-0 mt-0.5', stat.color)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="motion-fade-in motion-slide-up">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
              <div className="mt-3 space-y-2">
                <Link to="/records">
                  <Button variant="default" size="sm" className="w-full justify-start gap-2 motion-press">
                    <FileText className="size-4" />
                    New Record
                  </Button>
                </Link>
                <Link to="/records">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 motion-press">
                    View All Records
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              <p className="mt-6 text-center text-sm text-muted-foreground/60">
                Select a module from the navigation to get started.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
```

**Verification:** Navigate to `/`. Four stat cards visible with gold top border. Staggered animation. Skeleton loading on mount. Quick actions link to records page. Build with `npm run build`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx src/api/records.ts
git commit -m "feat(dashboard): stat cards, skeleton loading, staggered entry, quick actions"
```

---

### Task 6: Records Page Redesign

**Files:**
- Modify: `src/features/records/RecordsPage.tsx`

- [ ] **Step 1: Refactor RecordsPage with table, staggered rows, skeleton loading, status dots**

Replace the entire `src/features/records/RecordsPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { getRecords, createRecord, updateRecord, deleteRecord, type ApiRecord } from '@/api/records'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  approved:  { label: 'Approved',  icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  rejected:  { label: 'Rejected',  icon: XCircle,      color: 'text-red-pinoy',   bg: 'bg-red-50 dark:bg-red-500/10' },
}

export default function RecordsPage() {
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    getRecords()
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      if (editingId) {
        await updateRecord(editingId, { title, status })
        setRecords((prev) =>
          prev.map((r) => r.id === editingId ? { ...r, title, status } : r),
        )
      } else {
        const created = await createRecord({ title, status })
        setRecords((prev) => [created, ...prev])
      }
      setTitle('')
      setStatus('pending')
      setEditingId(null)
      setPanelOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  function openCreatePanel() {
    setEditingId(null)
    setTitle('')
    setStatus('pending')
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiRecord) {
    setEditingId(record.id)
    setTitle(record.title)
    setStatus(record.status)
    setPanelOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteRecord(deletingId)
      setRecords((prev) => prev.filter((r) => r.id !== deletingId))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setTitle('')
    setStatus('pending')
  }

  return (
    <>
      <PageHeader title="Blotter Records" subtitle="Manage and track incident reports and complaints.">
        {hasRole('admin', 'staff') && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Record
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No records found.</p>
              {hasRole('admin', 'staff') && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Create first record
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full motion-stagger-50">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Title</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => {
                    const cfg = statusConfig[record.status]
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={record.id}
                        className="border-b last:border-b-0 motion-fade-in motion-slide-up"
                        style={{ ['--stagger-index' as string]: i }}
                      >
                        <td className="px-4 py-3 sm:px-6 text-sm font-medium text-foreground">{record.title}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                            <StatusIcon className="size-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                          {new Date(record.updated).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0"
                              onClick={() => openEditPanel(record)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(record.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-over panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-card border-l border-border shadow-xl motion-slide-up motion-fade-in overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Record' : 'New Record'}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="space-y-2">
                <Label htmlFor="panel-title">Title</Label>
                <Input id="panel-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-status">Status</Label>
                <Select
                  id="panel-status"
                  value={status}
                  onValueChange={(v) => setStatus(v as 'pending' | 'approved' | 'rejected')}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete record"
        message="This action cannot be undone. The record and all its data will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
```

**Verification:** Navigate to `/records`. Table renders with staggered row entry. "New Record" button opens slide-over panel. Empty state shows CTA. Skeleton loading on mount. Status badges have dot icons. Build with `npm run build`.

- [ ] **Step 2: Commit**

```bash
git add src/features/records/RecordsPage.tsx
git commit -m "feat(records): table layout, slide-over panel, status dots, skeleton loading"
```

---

### Task 7: Settings Page Refinement

**Files:**
- Modify: `src/features/settings/SystemSettings.tsx`

- [ ] **Step 1: Tighten spacing, add skeleton loading, refine toast animation**

Replace the entire `src/features/settings/SystemSettings.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { Loader2, X, Plus, Building2, Users, MapPin, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getClient } from '@/api/client'
import { updateSetting, type ApiSetting } from '@/api/settings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TagInputProps {
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}

function TagInput({ items, placeholder, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const trimmed = input.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setInput('')
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 min-h-7">
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground/60 italic">None added yet</span>
        )}
        {items.map((item, i) => (
          <span
            key={item}
            className="inline-flex motion-scale-in items-center gap-1 rounded-md border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(i)}
              className="inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${item}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
          aria-label="Add"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

interface SettingsFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
  required?: boolean
  placeholder?: string
}

function SettingsField({ label, value, onChange, required, placeholder }: SettingsFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
      />
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingIds, setSettingIds] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  const [barangayName, setBarangayName] = useState('')
  const [municipalityCity, setMunicipalityCity] = useState('')
  const [province, setProvince] = useState('')
  const [region, setRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [barangayCaptain, setBarangayCaptain] = useState('')
  const [barangaySecretary, setBarangaySecretary] = useState('')
  const [barangayTreasurer, setBarangayTreasurer] = useState('')
  const [purokOptions, setPurokOptions] = useState<string[]>([])
  const [incidentTypes, setIncidentTypes] = useState<string[]>([])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stateRef = useRef({
    barangayName, municipalityCity, province, region, postalCode, contactNumber,
    barangayCaptain, barangaySecretary, barangayTreasurer,
    purokOptions, incidentTypes, settingIds,
  })
  stateRef.current = {
    barangayName, municipalityCity, province, region, postalCode, contactNumber,
    barangayCaptain, barangaySecretary, barangayTreasurer,
    purokOptions, incidentTypes, settingIds,
  }

  useEffect(() => {
    loadSettings()
    return () => {
      clearTimeout(saveTimerRef.current)
      clearTimeout(toastTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(toastTimerRef.current)
  }, [toast])

  async function loadSettings() {
    try {
      setLoading(true)
      setError(null)
      const records = await getClient().collection('system_settings').getFullList<ApiSetting>()
      const ids: Record<string, string> = {}
      const vals: Record<string, any> = {}
      for (const r of records) { ids[r.key] = r.id; vals[r.key] = r.value }

      setSettingIds(ids)
      setBarangayName(vals.barangay_name ?? '')
      setMunicipalityCity(vals.municipality_city ?? '')
      setProvince(vals.province ?? '')
      setRegion(vals.region ?? '')
      setPostalCode(vals.postal_code ?? '')
      setContactNumber(vals.contact_number ?? '')
      setBarangayCaptain(vals.barangay_captain ?? '')
      setBarangaySecretary(vals.barangay_secretary ?? '')
      setBarangayTreasurer(vals.barangay_treasurer ?? '')
      setPurokOptions(vals.purok_options ?? [])
      setIncidentTypes(vals.incident_types ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(performSave, 1500)
  }

  async function performSave() {
    const s = stateRef.current
    const entries: [string, string | string[]][] = [
      ['barangay_name', s.barangayName],
      ['municipality_city', s.municipalityCity],
      ['province', s.province],
      ['region', s.region],
      ['postal_code', s.postalCode],
      ['contact_number', s.contactNumber],
      ['barangay_captain', s.barangayCaptain],
      ['barangay_secretary', s.barangaySecretary],
      ['barangay_treasurer', s.barangayTreasurer],
      ['purok_options', s.purokOptions],
      ['incident_types', s.incidentTypes],
    ]

    try {
      setAutoSaving(true)
      await Promise.all(
        entries.map(([key, value]) => {
          const id = s.settingIds[key]
          if (!id) return Promise.resolve()
          return updateSetting(id, key, value)
        }),
      )
      setToast({ type: 'success', message: 'Settings saved.' })
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setAutoSaving(false)
    }
  }

  function onChange(setter: (val: string) => void): (val: string) => void {
    return (val) => { setter(val); scheduleSave() }
  }

  function onArrayChange(setter: (items: string[]) => void): (items: string[]) => void {
    return (items) => { setter(items); scheduleSave() }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="System Settings" subtitle="Configure the barangay identity and reference lists." />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card shadow-sm p-4 space-y-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-8 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-8 w-full" />
                <SkeletonBlock className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="System Settings" subtitle="Configure the barangay identity and reference lists." />
        <div className="mx-auto max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadSettings}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="System Settings" subtitle="Configure the barangay identity and reference lists.">
        {autoSaving && (
          <span className="flex motion-fade-in items-center gap-1.5 text-xs text-muted-foreground/60">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        )}
      </PageHeader>

      <div className="space-y-3">
        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Building2 className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Barangay Information
            </h2>
          </div>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-3">
              <SettingsField label="Barangay Name" value={barangayName} onChange={onChange(setBarangayName)} required />
              <SettingsField label="Municipality / City" value={municipalityCity} onChange={onChange(setMunicipalityCity)} required />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <SettingsField label="Province" value={province} onChange={onChange(setProvince)} placeholder="e.g. Capiz" />
              <SettingsField label="Region" value={region} onChange={onChange(setRegion)} placeholder="e.g. VI" />
              <SettingsField label="Postal Code" value={postalCode} onChange={onChange(setPostalCode)} placeholder="e.g. 5800" />
              <SettingsField label="Contact No." value={contactNumber} onChange={onChange(setContactNumber)} placeholder="e.g. 0917..." />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <Users className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Barangay Officials
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 p-3">
            <SettingsField label="Barangay Captain" value={barangayCaptain} onChange={onChange(setBarangayCaptain)} placeholder="Full name" />
            <SettingsField label="Barangay Secretary" value={barangaySecretary} onChange={onChange(setBarangaySecretary)} placeholder="Full name" />
            <SettingsField label="Barangay Treasurer" value={barangayTreasurer} onChange={onChange(setBarangayTreasurer)} placeholder="Full name" />
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <MapPin className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Purok Options
            </h2>
          </div>
          <div className="p-3">
            <p className="mb-2.5 text-[11px] text-muted-foreground/60">
              Puroks and sitios available when assigning locations on records.
            </p>
            <TagInput items={purokOptions} placeholder="Add purok..." onChange={onArrayChange(setPurokOptions)} />
          </div>
        </section>

        <section className="rounded-lg border bg-card shadow-sm motion-fade-in motion-slide-up" style={{ animationDelay: '225ms' }}>
          <div className="flex items-center gap-2 border-b border-bamboo/40 px-4 py-2.5 dark:border-bamboo/20">
            <ShieldAlert className="size-4 text-muted-foreground/60" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              Incident Types
            </h2>
          </div>
          <div className="p-3">
            <p className="mb-2.5 text-[11px] text-muted-foreground/60">
              Categories used to classify incidents and complaints.
            </p>
            <TagInput items={incidentTypes} placeholder="Add type..." onChange={onArrayChange(setIncidentTypes)} />
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 motion-slide-up">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur-sm',
              toast.type === 'success' ? 'border-emerald-500/30' : 'border-destructive/30',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 shrink-0 text-muted-foreground opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Verification:** Navigate to `/settings` as admin. Sections render with tighter `p-3` padding. Toast appears at bottom-right with slide-up animation. Tags animate in on add. Skeleton blocks on load. Build with `npm run build`.

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/SystemSettings.tsx
git commit -m "feat(settings): tighter spacing, skeleton loading, refined toast, tag animations"
```

# Group E: Reports Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tabbed Reports Dashboard at `/reports` aggregating data across residents, documents, blotter, assets, and visitors.

**Architecture:** Single `src/api/reports.ts` module fetches from existing API modules and computes summaries client-side. Single `src/features/reports/ReportsPage.tsx` with tab state switching between 6 tab views. No new PocketBase collections.

**Tech Stack:** React + TypeScript + PocketBase SDK + lucide-react + CSS bar charts

## Global Constraints

- Zero new JS dependencies beyond existing `package.json`
- No JS animation libraries; CSS-only motion utilities (transform/opacity, GPU-composited)
- `prefers-reduced-motion` respected
- Filipino palette (capiz, gold, narra, bamboo, red-pinoy, barangay) within clean enterprise design
- Dark mode base `#12100E`
- `cn()` utility (`@/lib/utils`) for conditional classes
- `BarChart3` and `LayoutDashboard` icons from lucide-react (both verified present)
- All existing API signatures: `getResidents()`, `getDocuments()`, `getBlotters()`, `getAssets()`, `getVisitors()`, `getResidentsSummary()`
- Error handling: report functions return zeroed shapes on failure, never throw

---

## File Structure

**New files:**
- `src/api/reports.ts` — 6 report aggregation functions + overview composite
- `src/features/reports/ReportsPage.tsx` — tabbed reports dashboard
- `src/features/reports/index.ts` — barrel export

**Modified files:**
- `src/routes/index.tsx` — add `/reports` route
- `src/components/Sidebar.tsx` — add Reports nav group

---

### Task 1: Reports API module

**Files:**
- Create: `src/api/reports.ts`

**Interfaces:**
- Consumes: `getResidents()` → `ApiResident[]` from `@/api/residents`
- Consumes: `getDocuments()` → `ApiDocument[]` from `@/api/documents`
- Consumes: `getBlotters()` → `ApiBlotter[]` from `@/api/blotter`
- Consumes: `getAssets()` → `ApiAsset[]` from `@/api/assets`
- Consumes: `getVisitors()` → `ApiVisitor[]` from `@/api/visitors`
- Produces: exported types and functions below

- [ ] **Step 1: Create `src/api/reports.ts`**

```typescript
import { getResidents, type ApiResident } from './residents'
import { getDocuments, type ApiDocument } from './documents'
import { getBlotters, type ApiBlotter } from './blotter'
import { getAssets, type ApiAsset } from './assets'
import { getVisitors, type ApiVisitor } from './visitors'

// --- Demographics ---

export interface DemographicsReport {
  total: number
  byPurok: Record<string, number>
  byGender: { male: number; female: number }
  byCivilStatus: Record<string, number>
  voters: number
  senior: number
  pwd: number
  fourPs: number
  ageGroups: { under18: number; adult: number; senior: number }
}

export async function getDemographicsReport(): Promise<DemographicsReport> {
  try {
    const all = await getResidents()
    const byPurok: Record<string, number> = {}
    const byCivilStatus: Record<string, number> = {}
    let male = 0, female = 0
    let voters = 0, senior = 0, pwd = 0, fourPs = 0
    let under18 = 0, adult = 0, seniorCount = 0

    for (const r of all) {
      if (r.purok) byPurok[r.purok] = (byPurok[r.purok] || 0) + 1
      if (r.gender === 'male') male++; else if (r.gender === 'female') female++
      if (r.civil_status) byCivilStatus[r.civil_status] = (byCivilStatus[r.civil_status] || 0) + 1
      if (r.is_voter) voters++
      if (r.is_senior) senior++
      if (r.is_pwd) pwd++
      if (r.is_4ps) fourPs++
      const age = r.age
      if (age != null) {
        if (age < 18) under18++
        else if (age < 60) adult++
        else seniorCount++
      }
    }

    return {
      total: all.length,
      byPurok,
      byGender: { male, female },
      byCivilStatus,
      voters, senior, pwd, fourPs,
      ageGroups: { under18, adult, senior: seniorCount },
    }
  } catch {
    return {
      total: 0, byPurok: {}, byGender: { male: 0, female: 0 },
      byCivilStatus: {}, voters: 0, senior: 0, pwd: 0, fourPs: 0,
      ageGroups: { under18: 0, adult: 0, senior: 0 },
    }
  }
}

// --- Documents ---

export interface DocumentsReport {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  todayRequests: number
}

export async function getDocumentsReport(): Promise<DocumentsReport> {
  try {
    const all = await getDocuments()
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    let todayRequests = 0

    for (const d of all) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1
      byType[d.document_type] = (byType[d.document_type] || 0) + 1
      if (d.requested_at?.startsWith(todayStr)) todayRequests++
    }

    return { total: all.length, byStatus, byType, todayRequests }
  } catch {
    return { total: 0, byStatus: {}, byType: {}, todayRequests: 0 }
  }
}

// --- Blotter ---

export interface BlotterReport {
  total: number
  byStatus: Record<string, number>
  byIncidentType: Record<string, number>
}

export async function getBlotterReport(): Promise<BlotterReport> {
  try {
    const all = await getBlotters()
    const byStatus: Record<string, number> = {}
    const byIncidentType: Record<string, number> = {}

    for (const b of all) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1
      byIncidentType[b.incident_type] = (byIncidentType[b.incident_type] || 0) + 1
    }

    return { total: all.length, byStatus, byIncidentType }
  } catch {
    return { total: 0, byStatus: {}, byIncidentType: {} }
  }
}

// --- Assets ---

export interface AssetsReport {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
  totalValue: number
}

export async function getAssetsReport(): Promise<AssetsReport> {
  try {
    const all = await getAssets()
    const byType: Record<string, number> = {}
    const byCondition: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let totalValue = 0

    for (const a of all) {
      byType[a.asset_type] = (byType[a.asset_type] || 0) + 1
      byCondition[a.condition] = (byCondition[a.condition] || 0) + 1
      const s = a.status ?? 'unknown'
      byStatus[s] = (byStatus[s] || 0) + 1
      if (a.current_value) totalValue += a.current_value
    }

    return { total: all.length, byType, byCondition, byStatus, totalValue }
  } catch {
    return { total: 0, byType: {}, byCondition: {}, byStatus: {}, totalValue: 0 }
  }
}

// --- Visitors ---

export interface VisitorsReport {
  total: number
  activeVisits: number
  byPurpose: Record<string, number>
}

export async function getVisitorsReport(): Promise<VisitorsReport> {
  try {
    const all = await getVisitors()
    const byPurpose: Record<string, number> = {}
    let activeVisits = 0

    for (const v of all) {
      byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1
      if (!v.time_out) activeVisits++
    }

    return { total: all.length, activeVisits, byPurpose }
  } catch {
    return { total: 0, activeVisits: 0, byPurpose: {} }
  }
}

// --- Overview (composite) ---

export interface OverviewReport {
  demographics: DemographicsReport
  documents: DocumentsReport
  blotter: BlotterReport
  assets: AssetsReport
  visitors: VisitorsReport
}

export async function getOverviewReport(): Promise<OverviewReport> {
  const [demographics, documents, blotter, assets, visitors] = await Promise.all([
    getDemographicsReport(),
    getDocumentsReport(),
    getBlotterReport(),
    getAssetsReport(),
    getVisitorsReport(),
  ])
  return { demographics, documents, blotter, assets, visitors }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

Expected: builds cleanly (imports match existing API modules)

- [ ] **Step 3: Commit**

```bash
git add src/api/reports.ts
git commit -m "feat: add Reports API module with aggregation functions"
```

---

### Task 2: ReportsPage component

**Files:**
- Create: `src/features/reports/ReportsPage.tsx`
- Create: `src/features/reports/index.ts`

**Interfaces:**
- Consumes: all report functions from `@/api/reports` (Task 1)
- Consumes: `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- Consumes: `PageHeader` from `@/components/ui/PageHeader`
- Consumes: `cn()` from `@/lib/utils`
- Produces: `ReportsPage` — default export

- [ ] **Step 1: Create barrel export `src/features/reports/index.ts`**

```typescript
export { default as ReportsPage } from './ReportsPage'
```

- [ ] **Step 2: Create `src/features/reports/ReportsPage.tsx`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Users, ClipboardList, FileText, Package, DoorOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  getDemographicsReport,
  getDocumentsReport,
  getBlotterReport,
  getAssetsReport,
  getVisitorsReport,
  getOverviewReport,
  type DemographicsReport,
  type DocumentsReport,
  type BlotterReport,
  type AssetsReport,
  type VisitorsReport,
  type OverviewReport,
} from '@/api/reports'

type TabId = 'overview' | 'demographics' | 'documents' | 'blotter' | 'assets' | 'visitors'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'demographics', label: 'Demographics', icon: Users },
  { id: 'documents', label: 'Documents', icon: ClipboardList },
  { id: 'blotter', label: 'Blotter', icon: FileText },
  { id: 'assets', label: 'Assets', icon: Package },
  { id: 'visitors', label: 'Visitors', icon: DoorOpen },
]

const tabLabels: Record<string, string> = {
  overview: 'Overview',
  demographics: 'Demographics',
  documents: 'Documents',
  blotter: 'Blotter',
  assets: 'Assets',
  visitors: 'Visitors',
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card className="overflow-hidden motion-lift">
      <div className="h-1 w-full bg-gold/60" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Icon className={cn('size-5 shrink-0 mt-0.5', color)} />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gold/60" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

function BarChart({ items, total, color = '#C9953E' }: {
  items: { label: string; count: number }[]
  total: number
  color?: string
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground/60">No data</p>
  }
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 text-xs font-medium truncate text-foreground">{item.label}</span>
          <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-foreground">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

function BarChartSkeleton() {
  return (
    <div className="space-y-1.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="flex-1 h-5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-8 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function SectionCard({ title, children, className }: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('motion-fade-in motion-slide-up', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewReport | null>(null)
  const [demographics, setDemographics] = useState<DemographicsReport | null>(null)
  const [documents, setDocuments] = useState<DocumentsReport | null>(null)
  const [blotter, setBlotter] = useState<BlotterReport | null>(null)
  const [assets, setAssets] = useState<AssetsReport | null>(null)
  const [visitors, setVisitors] = useState<VisitorsReport | null>(null)
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(new Set())

  const loadTab = useCallback(async (tab: TabId) => {
    if (loadedTabs.has(tab)) return
    setLoading(true)
    try {
      switch (tab) {
        case 'overview': {
          const data = await getOverviewReport()
          setOverview(data)
          break
        }
        case 'demographics': {
          const data = await getDemographicsReport()
          setDemographics(data)
          break
        }
        case 'documents': {
          const data = await getDocumentsReport()
          setDocuments(data)
          break
        }
        case 'blotter': {
          const data = await getBlotterReport()
          setBlotter(data)
          break
        }
        case 'assets': {
          const data = await getAssetsReport()
          setAssets(data)
          break
        }
        case 'visitors': {
          const data = await getVisitorsReport()
          setVisitors(data)
          break
        }
      }
      setLoadedTabs((prev) => new Set(prev).add(tab))
    } catch {
      // Report functions already catch internally, but guard anyway
    } finally {
      setLoading(false)
    }
  }, [loadedTabs])

  useEffect(() => {
    loadTab(activeTab)
  }, [activeTab, loadTab])

  const sortedEntries = (record: Record<string, number>): { label: string; count: number }[] =>
    Object.entries(record)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

  function renderTabContent() {
    if (loading) {
      switch (activeTab) {
        case 'overview':
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[1,2,3,4,5].map((i) => <StatCardSkeleton key={i} />)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
              </div>
            </div>
          )
        default:
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1,2,3,4].map((i) => <StatCardSkeleton key={i} />)}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
                <SectionCard title=""><BarChartSkeleton /></SectionCard>
              </div>
            </div>
          )
      }
    }

    switch (activeTab) {
      case 'overview':
        if (!overview) return null
        return renderOverview(overview)
      case 'demographics':
        if (!demographics) return null
        return renderDemographics(demographics)
      case 'documents':
        if (!documents) return null
        return renderDocuments(documents)
      case 'blotter':
        if (!blotter) return null
        return renderBlotter(blotter)
      case 'assets':
        if (!assets) return null
        return renderAssets(assets)
      case 'visitors':
        if (!visitors) return null
        return renderVisitors(visitors)
    }
  }

  function renderOverview(data: OverviewReport) {
    const d = data.demographics
    const docs = data.documents
    const b = data.blotter
    const a = data.assets
    const v = data.visitors
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Residents" value={d.total} icon={Users} color="text-barangay" />
          <StatCard label="Document Requests" value={docs.total} icon={ClipboardList} color="text-gold" />
          <StatCard label="Blotter Cases" value={b.total} icon={FileText} color="text-red-pinoy" />
          <StatCard label="Total Assets" value={a.total} icon={Package} color="text-emerald-500" />
          <StatCard label="Visitor Entries" value={v.total} icon={DoorOpen} color="text-blue-500" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Residents by Purok (Top 5)">
            <BarChart items={sortedEntries(d.byPurok).slice(0, 5)} total={d.total} />
          </SectionCard>
          <SectionCard title="Documents by Status">
            <BarChart items={sortedEntries(docs.byStatus)} total={docs.total} />
          </SectionCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Blotter by Status">
            <BarChart items={sortedEntries(b.byStatus)} total={b.total} />
          </SectionCard>
          <SectionCard title="Visitors by Purpose">
            <BarChart items={sortedEntries(v.byPurpose)} total={v.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderDemographics(data: DemographicsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Residents" value={data.total} icon={Users} color="text-barangay" />
          <StatCard label="Voters" value={data.voters} icon={Users} color="text-blue-500" />
          <StatCard label="Seniors" value={data.senior} icon={Users} color="text-amber-500" />
          <StatCard label="PWD" value={data.pwd} icon={Users} color="text-red-pinoy" />
          <StatCard label="4Ps" value={data.fourPs} icon={Users} color="text-emerald-500" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Purok">
            <BarChart items={sortedEntries(data.byPurok)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Gender">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Male</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{data.byGender.male}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Female</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{data.byGender.female}</p>
                </CardContent>
              </Card>
            </div>
          </SectionCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Civil Status">
            <BarChart items={sortedEntries(data.byCivilStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="Age Groups">
            <BarChart
              items={[
                { label: 'Under 18', count: data.ageGroups.under18 },
                { label: 'Adult (18-59)', count: data.ageGroups.adult },
                { label: 'Senior (60+)', count: data.ageGroups.senior },
              ]}
              total={data.total}
            />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderDocuments(data: DocumentsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total Requests" value={data.total} icon={ClipboardList} color="text-barangay" />
          <StatCard label="Today's Requests" value={data.todayRequests} icon={ClipboardList} color="text-gold" />
          {sortedEntries(data.byStatus).slice(0, 2).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.count} icon={ClipboardList} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Document Type">
            <BarChart items={sortedEntries(data.byType)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderBlotter(data: BlotterReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Cases" value={data.total} icon={FileText} color="text-barangay" />
          {sortedEntries(data.byStatus).slice(0, 2).map((s) => (
            <StatCard key={s.label} label={s.label} value={s.count} icon={FileText} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Incident Type">
            <BarChart items={sortedEntries(data.byIncidentType)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderAssets(data: AssetsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total Assets" value={data.total} icon={Package} color="text-barangay" />
          <StatCard label="Total Value" value={`₱${data.totalValue.toLocaleString()}`} icon={Package} color="text-gold" />
          {sortedEntries(data.byCondition).slice(0, 2).map((c) => (
            <StatCard key={c.label} label={c.label} value={c.count} icon={Package} color="text-muted-foreground" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="By Type">
            <BarChart items={sortedEntries(data.byType)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Condition">
            <BarChart items={sortedEntries(data.byCondition)} total={data.total} />
          </SectionCard>
          <SectionCard title="By Status">
            <BarChart items={sortedEntries(data.byStatus)} total={data.total} />
          </SectionCard>
        </div>
      </div>
    )
  }

  function renderVisitors(data: VisitorsReport) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Visits" value={data.total} icon={DoorOpen} color="text-barangay" />
          <StatCard label="Active Now" value={data.activeVisits} icon={DoorOpen} color="text-emerald-500" />
        </div>
        <SectionCard title="By Purpose">
          <BarChart items={sortedEntries(data.byPurpose)} total={data.total} />
        </SectionCard>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Reports Dashboard" subtitle="Summary and insights across all barangay data" />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-bamboo/40">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </>
  )
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 3: Commit**

```bash
git add src/features/reports/index.ts src/features/reports/ReportsPage.tsx
git commit -m "feat: add Reports Dashboard page with tabbed views and CSS bar charts"
```

---

### Task 3: Routes + Sidebar

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update `src/routes/index.tsx`**

Add import:
```typescript
import { ReportsPage } from '@/features/reports'
```

Add route inside `<Layout>` after the agenda route (alphabetical order — `/reports` comes before `/residents`):
```typescript
<Route
  path="reports"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <ReportsPage />
    </ProtectedRoute>
  }
/>
```

Place it right after the `/records` route block and before `/residents`.

- [ ] **Step 2: Update `src/components/Sidebar.tsx`**

Add `BarChart3` to lucide-react imports:
```typescript
import {
  LayoutDashboard,
  FileText,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Users,
  Home,
  ClipboardList,
  CheckSquare,
  ClipboardCheck,
  DoorOpen,
  Package,
  Calendar,
  BarChart3,  // add this
} from 'lucide-react'
```

Add Reports nav group after Administration:
```typescript
{
  label: 'Reports',
  items: [
    { to: '/reports', label: 'Reports Dashboard', icon: BarChart3, roles: ['admin', 'staff'] },
  ],
},
```

Place it right after the Administration group entry in the `navGroups` array.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly, no type errors

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx src/components/Sidebar.tsx
git commit -m "feat: wire Reports Dashboard into routes and sidebar"
```

---

### Task 4: Verify build + integration

**Files:** none

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: 0 errors, clean TypeScript + Vite build

- [ ] **Step 2: Verify route integration**

Check that:
- `/reports` has `ProtectedRoute roles={['admin', 'staff']}`
- Route is in alphabetical order among existing routes

- [ ] **Step 3: Verify sidebar ordering**

Sidebar groups in correct order:
1. Overview
2. Residents
3. Documents
4. Records
5. Logs
6. Planning
7. Administration
8. Reports (new — Reports Dashboard)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize Group E implementation"
```

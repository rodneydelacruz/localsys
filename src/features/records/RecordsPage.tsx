import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from 'lucide-react'
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
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'updated'>('updated')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [error, setError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : 'Failed to save record')
    }
  }

  function openCreatePanel() {
    setError(null)
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
    setError(null)
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
      setError(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setDeletingId(null)
    }
  }

  function handleSort(field: 'title' | 'status' | 'updated') {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status)
      else cmp = new Date(a.updated).getTime() - new Date(b.updated).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [records, sortBy, sortDir])

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setTitle('')
    setStatus('pending')
    setError(null)
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
        <CardContent className="p-0">
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
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6 cursor-pointer select-none" onClick={() => handleSort('title')}>
                      <span className="inline-flex items-center gap-1">
                        Title
                        {sortBy === 'title' && (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                      </span>
                    </th>
                    <th className="px-4 py-3 sm:px-6 cursor-pointer select-none" onClick={() => handleSort('status')}>
                      <span className="inline-flex items-center gap-1">
                        Status
                        {sortBy === 'status' && (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                      </span>
                    </th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6 cursor-pointer select-none" onClick={() => handleSort('updated')}>
                      <span className="inline-flex items-center gap-1">
                        Date
                        {sortBy === 'updated' && (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                      </span>
                    </th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((record, i) => {
                    const cfg = statusConfig[record.status]
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={record.id}
                        className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
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

      {/* Slide-over panel / bottom drawer */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
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
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
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

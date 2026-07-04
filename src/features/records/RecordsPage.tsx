import { useState, useEffect } from 'react'
import { getRecords, createRecord, updateRecord, deleteRecord, type ApiRecord } from '@/api/records'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'

const statusColors: Record<string, 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

export default function RecordsPage() {
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getRecords().then(setRecords).catch(console.error)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      if (editingId) {
        await updateRecord(editingId, { title, status })
        setRecords((prev) =>
          prev.map((r) =>
            r.id === editingId ? { ...r, title, status } : r,
          ),
        )
      } else {
        const created = await createRecord({ title, status })
        setRecords((prev) => [created, ...prev])
      }
      setTitle('')
      setStatus('pending')
      setEditingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  function startEdit(record: ApiRecord) {
    setEditingId(record.id)
    setTitle(record.title)
    setStatus(record.status)
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

  function cancelEdit() {
    setEditingId(null)
    setTitle('')
    setStatus('pending')
  }

  return (
    <>
      <PageHeader title="Blotter Records" subtitle="Manage and track incident reports and complaints." />
    <div className="space-y-6">
      {hasRole('admin', 'staff') && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Record' : 'New Record'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={status}
                  onValueChange={(v) => setStatus(v as 'pending' | 'approved' | 'rejected')}
                  className="w-32"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.length === 0 && (
              <p className="text-sm text-muted-foreground">No records found.</p>
            )}
            {records.map((record, i) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded border p-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="space-y-1">
                  <p className="font-medium">{record.title}</p>
                  <Badge variant={statusColors[record.status]}>
                    {record.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(record)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

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

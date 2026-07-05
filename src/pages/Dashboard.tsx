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
    getRecordsSummary().then(setStats).catch(() => {}).finally(() => setLoading(false))
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 motion-stagger-75">
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

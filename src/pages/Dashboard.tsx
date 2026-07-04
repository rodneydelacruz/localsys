import { PageHeader } from '@/components/ui/PageHeader'

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of barangay records and system activity" />
      <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-bamboo/50 py-24">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Select a module from the navigation to get started.</p>
        </div>
      </div>
    </>
  )
}

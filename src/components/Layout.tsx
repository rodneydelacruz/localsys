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
    <div className="flex min-h-screen">
      <Sidebar pinned={pinned} onTogglePin={togglePinned} />
      <div
        className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: pinned ? '15rem' : '4rem' }}
        aria-hidden="true"
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <div key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8 animate-page-enter">
          <Outlet />
        </div>
        <OfflineIndicator />
      </main>
    </div>
  )
}

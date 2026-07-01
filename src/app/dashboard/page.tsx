'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth'
import Sidebar from '@/components/Sidebar'
import MetricsDashboard from '@/components/MetricsCard'
import ThemeToggle from '@/components/ThemeToggle'
import ExportButton from '@/components/ExportButton'

const links = [
  { href: '/dashboard', label: 'Dashboard', active: true },
  { href: '/accounts', label: 'Accounts' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/campaigns/new', label: 'New Campaign' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'CLIENT') { router.push('/admin/clients'); return }
  }, [user, authLoading, router])

  if (!user) return null

  return (
    <div className="flex flex-1">
      <Sidebar links={links} />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-zinc-500">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton type="campaigns" />
            <ExportButton type="accounts" />
            <ThemeToggle />
          </div>
        </div>

        <MetricsDashboard />
      </main>
    </div>
  )
}

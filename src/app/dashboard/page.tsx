'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth'
import Sidebar, { Skeleton } from '@/components/Sidebar'

interface DashboardData {
  accountsCount: number
  readyCount: number
  campaignsCount: number
  warmingCount: number
  bannedCount: number
  expiredCount: number
}

const links = [
  { href: '/dashboard', label: 'Dashboard', active: true },
  { href: '/accounts', label: 'Accounts' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/campaigns/new', label: 'New Campaign' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'CLIENT') { router.push('/admin/clients'); return }

    Promise.all([
      fetch(`/api/accounts?userId=${user.id}`).then(r => r.json()),
      fetch(`/api/campaigns?userId=${user.id}`).then(r => r.json()),
    ])
      .then(([accountsRes, campaignsRes]) => {
        setData({
          accountsCount: accountsRes.total ?? 0,
          readyCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'READY').length ?? 0,
          campaignsCount: campaignsRes.campaigns?.length ?? 0,
          warmingCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'WARMING').length ?? 0,
          bannedCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'BANNED').length ?? 0,
          expiredCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'EXPIRED').length ?? 0,
        })
      })
      .catch((err) => setError(err.message))
  }, [user, authLoading, router])

  if (!user) return null

  return (
    <div className="flex flex-1">
      <Sidebar links={links} />

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-500 mb-8">Welcome back, {user.name}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600">{error}</div>
        )}

        {!data ? (
          <Skeleton rows={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Total Accounts" value={data.accountsCount} />
            <StatCard label="Ready" value={data.readyCount} color="text-green-600" />
            <StatCard label="Warming" value={data.warmingCount} color="text-yellow-600" />
            <StatCard label="Banned" value={data.bannedCount} color="text-red-600" />
            <StatCard label="Expired" value={data.expiredCount} color="text-zinc-500" />
            <StatCard label="Campaigns" value={data.campaignsCount} color="text-blue-600" />
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-sm transition-shadow">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? ''}`}>{value}</p>
    </div>
  )
}

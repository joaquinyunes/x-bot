'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardData {
  accountsCount: number
  readyCount: number
  campaignsCount: number
  warmingCount: number
  bannedCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) {
      router.push('/login')
      return
    }
    const u = JSON.parse(stored)
    setUser(u)
    if (u.role !== 'CLIENT') {
      router.push('/admin/clients')
      return
    }

    Promise.all([
      fetch(`/api/accounts?userId=${u.id}`).then(r => r.json()),
      fetch(`/api/campaigns?userId=${u.id}`).then(r => r.json()),
    ]).then(([accountsRes, campaignsRes]) => {
      setData({
        accountsCount: accountsRes.total ?? 0,
        readyCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'READY').length ?? 0,
        campaignsCount: campaignsRes.campaigns?.length ?? 0,
        warmingCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'WARMING').length ?? 0,
        bannedCount: accountsRes.accounts?.filter((a: { status: string }) => a.status === 'BANNED').length ?? 0,
      })
    })
  }, [router])

  if (!user || !data) {
    return <div className="flex flex-1 items-center justify-center"><p>Loading...</p></div>
  }

  const handleLogout = () => {
    localStorage.removeItem('xbot_user')
    router.push('/login')
  }

  return (
    <div className="flex flex-1">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-bold text-lg">x-bot</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium">Dashboard</Link>
          <Link href="/accounts" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Accounts</Link>
          <Link href="/campaigns" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Campaigns</Link>
          <Link href="/campaigns/new" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">New Campaign</Link>
        </nav>
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">{user.email}</p>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline mt-1">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p className="text-zinc-500 mb-8">Welcome, {user.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">Total Accounts</p>
            <p className="text-3xl font-bold mt-1">{data.accountsCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">Ready</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{data.readyCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">Campaigns</p>
            <p className="text-3xl font-bold mt-1">{data.campaignsCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">Warming</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{data.warmingCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-sm text-zinc-500">Banned</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{data.bannedCount}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

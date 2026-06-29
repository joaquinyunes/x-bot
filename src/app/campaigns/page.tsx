'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Campaign {
  id: string
  urls: string
  comments: string
  browsersCount: number
  status: string
  createdAt: string
  finishedAt: string | null
  _count: { campaignLogs: number }
}

export default function CampaignsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)

    fetch(`/api/campaigns?userId=${u.id}`)
      .then(r => r.json())
      .then(data => setCampaigns(data.campaigns ?? []))
  }, [router])

  return (
    <div className="flex flex-1">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-bold text-lg">x-bot</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</Link>
          <Link href="/accounts" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Accounts</Link>
          <Link href="/campaigns" className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium">Campaigns</Link>
          <Link href="/campaigns/new" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">New Campaign</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No campaigns yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium">URLs</th>
                  <th className="text-left py-3 px-4 font-medium">Browsers</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const urls = JSON.parse(c.urls) as string[]
                  return (
                    <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-3 px-4 max-w-xs truncate">{urls.join(', ')}</td>
                      <td className="py-3 px-4">{c.browsersCount}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : c.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' : c.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-800'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">{c._count.campaignLogs}</td>
                      <td className="py-3 px-4 text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

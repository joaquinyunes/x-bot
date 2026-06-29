'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar, { Skeleton } from '@/components/Sidebar'

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

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/campaigns', label: 'Campaigns', active: true },
  { href: '/campaigns/new', label: 'New Campaign' },
]

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PENDING: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
}

export default function CampaignsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    fetch(`/api/campaigns?userId=${u.id}`)
      .then(r => r.json())
      .then(data => { setCampaigns(data.campaigns ?? []); setLoading(false) })
  }, [router])

  return (
    <div className="flex flex-1">
      <Sidebar links={links} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            New Campaign
          </Link>
        </div>

        {loading ? (
          <Skeleton rows={5} />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No campaigns yet</p>
            <p className="text-sm">Create your first campaign to start automating interactions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium">URLs</th>
                  <th className="text-left py-3 px-4 font-medium">Browsers</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const urls = JSON.parse(c.urls) as string[]
                  return (
                    <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 max-w-xs truncate" title={urls.join('\n')}>{urls.join(', ')}</td>
                      <td className="py-3 px-4">{c.browsersCount}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] ?? ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">{c._count.campaignLogs}</td>
                      <td className="py-3 px-4 text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Link href={`/campaigns/${c.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          View
                        </Link>
                      </td>
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

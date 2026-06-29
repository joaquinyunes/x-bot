'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface CampaignDetail {
  id: string
  urls: string
  comments: string
  browsersCount: number
  status: string
  createdAt: string
  finishedAt: string | null
  campaignLogs: Array<{
    id: string
    url: string
    round: number
    action: string
    success: boolean
    errorMessage: string | null
    createdAt: string
    account: { username: string }
  }>
}

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/campaigns', label: 'Campaigns', active: true },
  { href: '/campaigns/new', label: 'New Campaign' },
]

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }

    const fetchCampaign = async () => {
      const res = await fetch(`/api/campaigns?id=${params.id}`)
      const data = await res.json()
      setCampaign(data.campaign ?? data)
      setLoading(false)
    }
    fetchCampaign()

    const evtSource = new EventSource(`/api/stream?campaignId=${params.id}`)
    evtSource.addEventListener('action', (e) => {
      const d = JSON.parse(e.data)
      setLogs((prev) => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${d.accountId?.slice(-6)} → ${d.action}: ${d.success ? '✅' : '❌'}`])
    })
    evtSource.addEventListener('complete', (e) => {
      const d = JSON.parse(e.data)
      setLogs((prev) => [...prev, `✅ ${d.message}`])
    })
    return () => evtSource.close()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex flex-1">
        <Sidebar links={links} />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-96" />
          </div>
        </main>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex flex-1">
        <Sidebar links={links} />
        <main className="flex-1 p-8">
          <p className="text-zinc-500">Campaign not found.</p>
        </main>
      </div>
    )
  }

  const urls = JSON.parse(campaign.urls) as string[]

  return (
    <div className="flex flex-1">
      <Sidebar links={links} />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Campaign Details</h1>
            <p className="text-sm text-zinc-500 mt-1">Created {new Date(campaign.createdAt).toLocaleString()}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
            campaign.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
            campaign.status === 'FAILED' ? 'bg-red-100 text-red-800' :
            'bg-zinc-100 text-zinc-800'
          }`}>
            {campaign.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">URLs</p>
            <p className="text-lg font-bold">{urls.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">Browsers</p>
            <p className="text-lg font-bold">{campaign.browsersCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-500">Total Actions</p>
            <p className="text-lg font-bold">{campaign.campaignLogs.length}</p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-2">Live Logs</h2>
            <div className="rounded-lg bg-zinc-900 text-green-400 p-4 text-xs font-mono h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium mb-3">Action Log</h2>
          {campaign.campaignLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">No actions logged yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2 px-3 font-medium">Account</th>
                    <th className="text-left py-2 px-3 font-medium">Action</th>
                    <th className="text-left py-2 px-3 font-medium">Round</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.campaignLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-900">
                      <td className="py-2 px-3">@{log.account?.username ?? '?'}</td>
                      <td className="py-2 px-3">{log.action}</td>
                      <td className="py-2 px-3">{log.round}</td>
                      <td className="py-2 px-3">
                        {log.success
                          ? <span className="text-green-600">✅ Success</span>
                          : <span className="text-red-600" title={log.errorMessage ?? ''}>❌ Failed</span>}
                      </td>
                      <td className="py-2 px-3 text-zinc-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

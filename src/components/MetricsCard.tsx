'use client'

import { useEffect, useState, useRef } from 'react'

interface MetricsData {
  accounts: { total: number; active: number; creating: number; failed: number }
  campaigns: { total: number; pending: number; running: number; completed: number; failed: number }
  actions: { total: number; likes: number; retweets: number; comments: number; videos: number; successRate: number }
  recentActivity: Array<{ id: string; type: string; message: string; timestamp: string; success: boolean }>
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/metrics')
        if (res.ok && !cancelled) {
          setMetrics(await res.json())
        }
      } catch (e) {
        console.error('Failed to fetch metrics', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  const cards = [
    {
      title: 'Total Accounts',
      value: metrics.accounts.total,
      subtitle: `${metrics.accounts.active} active`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Campaigns',
      value: metrics.campaigns.total,
      subtitle: `${metrics.campaigns.running} running`,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: 'Total Actions',
      value: metrics.actions.total,
      subtitle: `${metrics.actions.successRate}% success`,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Engagement',
      value: metrics.actions.likes + metrics.actions.retweets,
      subtitle: `${metrics.actions.comments} comments`,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title} className={`${card.bg} rounded-xl p-5 border border-zinc-200 dark:border-zinc-800`}>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.title}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-4">Actions Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Likes', value: metrics.actions.likes, color: 'bg-red-500' },
              { label: 'Retweets', value: metrics.actions.retweets, color: 'bg-green-500' },
              { label: 'Comments', value: metrics.actions.comments, color: 'bg-blue-500' },
              { label: 'Videos', value: metrics.actions.videos, color: 'bg-purple-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm w-20 text-zinc-500">{item.label}</span>
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${metrics.actions.total > 0 ? (item.value / metrics.actions.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.recentActivity.length === 0 && (
              <p className="text-sm text-zinc-400">No recent activity</p>
            )}
            {metrics.recentActivity.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${item.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-zinc-500">{item.type}</span>
                <span className="flex-1 truncate text-zinc-600 dark:text-zinc-400">{item.message}</span>
                <span className="text-xs text-zinc-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

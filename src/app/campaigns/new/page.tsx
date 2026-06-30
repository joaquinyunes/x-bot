'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth'
import Sidebar from '@/components/Sidebar'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/campaigns/new', label: 'New Campaign', active: true },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [accounts, setAccounts] = useState<Array<{ id: string; username: string; status: string }>>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [urls, setUrls] = useState('')
  const [comments, setComments] = useState('')
  const [browsersCount, setBrowsersCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [urlComments, setUrlComments] = useState<Record<string, string>>({})

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetch(`/api/accounts?userId=${user.id}&status=READY`)
      .then(r => r.json())
      .then(data => setAccounts(data.accounts ?? []))
  }, [user, authLoading, router])

  useEffect(() => {
    if (!campaignId) return
    const evtSource = new EventSource(`/api/stream?campaignId=${campaignId}`)
    evtSource.addEventListener('action', (e) => {
      const d = JSON.parse(e.data)
      setLogs((prev) => [...prev.slice(-100), `[${d.accountId?.slice(-6)}] ${d.action}: ${d.success ? 'OK' : 'FAIL'} ${d.round ? `(ronda ${d.round})` : ''}`])
    })
    evtSource.addEventListener('round', (e) => {
      const d = JSON.parse(e.data)
      setLogs((prev) => [...prev.slice(-100), `▶ Ronda ${d.round}/3 para ${d.accountId?.slice(-6)}`])
    })
    evtSource.addEventListener('complete', () => {
      setLogs((prev) => [...prev, '✅ Campaign complete!'])
      evtSource.close()
      setTimeout(() => router.push('/campaigns'), 2000)
    })
    evtSource.addEventListener('error', (e) => {
      const d = JSON.parse(e.data)
      setLogs((prev) => [...prev, `❌ Error: ${d.message}`])
    })
    return () => evtSource.close()
  }, [campaignId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSuccess('')
    setLoading(true)
    setLogs([])

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean)
    const commentList = comments.split('\n').map(c => c.trim()).filter(Boolean)

    if (selectedAccounts.length === 0) {
      setError('Select at least one account'); setLoading(false); return
    }
    if (urlList.length === 0) {
      setError('Enter at least one URL'); setLoading(false); return
    }

    const commentsPerUrl: Record<string, string[]> = {}
    for (const url of urlList) {
      const perUrl = urlComments[url]
      if (perUrl?.trim()) {
        commentsPerUrl[url] = perUrl.split('\n').map(c => c.trim()).filter(Boolean)
      }
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          accountIds: selectedAccounts,
          urls: urlList,
          comments: commentList,
          commentsPerUrl: Object.keys(commentsPerUrl).length > 0 ? commentsPerUrl : undefined,
          browsersCount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setCampaignId(data.campaignId)
      setLogs([`Campaign started with ${data.accountsCount} account(s)...`])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1">
      <Sidebar links={links} />

      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Campaign</h1>

        {success && (
          <div className="mb-4 rounded-lg bg-green-100 dark:bg-green-900 p-4 text-sm text-green-800 dark:text-green-200">{success}</div>
        )}

        {logs.length > 0 && (
          <div className="mb-4 rounded-lg bg-zinc-900 text-green-400 p-4 text-xs font-mono h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {campaignId ? null : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Accounts</label>
              {accounts.length === 0 ? (
                <p className="text-sm text-zinc-500">No ready accounts. <Link href="/accounts" className="text-blue-500 hover:underline">Create one first.</Link></p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {accounts.map(acc => (
                    <label key={acc.id} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(acc.id)}
                        onChange={() => setSelectedAccounts(prev =>
                          prev.includes(acc.id) ? prev.filter(a => a !== acc.id) : [...prev, acc.id]
                        )}
                        className="rounded"
                      />
                      <span className="text-sm">@{acc.username}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedAccounts.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1">{selectedAccounts.length} selected</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Post URLs (one per line)</label>
              <textarea
                value={urls}
                onChange={(e) => {
                  setUrls(e.target.value)
                  const urlList = e.target.value.split('\n').map(u => u.trim()).filter(Boolean)
                  const newUrlComments = { ...urlComments }
                  urlList.forEach(url => { if (!newUrlComments[url]) newUrlComments[url] = '' })
                  setUrlComments(newUrlComments)
                }}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://x.com/user/status/123"
              />
            </div>

            {Object.keys(urlComments).length > 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Per-URL Comments (optional)</label>
                {Object.entries(urlComments).map(([url, text]) => (
                  <div key={url}>
                    <p className="text-xs text-zinc-500 mb-1 truncate">{url}</p>
                    <textarea
                      value={text}
                      onChange={(e) => setUrlComments(prev => ({ ...prev, [url]: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comments for this URL (one per line)"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Default Comments (one per line)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Great video!&#10;Excellent content!&#10;Shared!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Browsers in parallel: {browsersCount}</label>
              <input
                type="range"
                min={1}
                max={Math.min(5, accounts.length || 1)}
                value={browsersCount}
                onChange={(e) => setBrowsersCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>1</span>
                <span>{browsersCount} browser(s) · {browsersCount} account(s)</span>
                <span>{Math.min(5, accounts.length || 1)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || selectedAccounts.length === 0}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting campaign...
                </span>
              ) : 'Start Campaign'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

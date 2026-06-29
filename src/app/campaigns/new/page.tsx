'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCampaignPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [accounts, setAccounts] = useState<Array<{ id: string; username: string; status: string }>>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [urls, setUrls] = useState('')
  const [comments, setComments] = useState('')
  const [browsersCount, setBrowsersCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)

    fetch(`/api/accounts?userId=${u.id}&status=READY`)
      .then(r => r.json())
      .then(data => setAccounts(data.accounts ?? []))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSuccess('')
    setLoading(true)

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean)
    const commentList = comments.split('\n').map(c => c.trim()).filter(Boolean)

    if (selectedAccounts.length === 0) {
      setError('Select at least one account')
      setLoading(false)
      return
    }
    if (urlList.length === 0) {
      setError('Enter at least one URL')
      setLoading(false)
      return
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
          browsersCount,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign')

      setSuccess(`Campaign created with ${data.accountsCount} account(s)`)
      setTimeout(() => router.push('/campaigns'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-1">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-bold text-lg">x-bot</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</Link>
          <Link href="/accounts" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Accounts</Link>
          <Link href="/campaigns" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Campaigns</Link>
          <Link href="/campaigns/new" className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium">New Campaign</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Campaign</h1>

        {success && (
          <div className="mb-4 rounded-lg bg-green-100 dark:bg-green-900 p-4 text-sm text-green-800 dark:text-green-200">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Accounts</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-zinc-500">No ready accounts. Create one first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {accounts.map(acc => (
                  <label key={acc.id} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                      className="rounded"
                    />
                    <span className="text-sm">@{acc.username}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Post URLs (one per line)</label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://x.com/user/status/123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comments (one per line, one per round)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Great video!&#10;Excellent content!&#10;Shared!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Browsers in parallel: {browsersCount}
            </label>
            <input
              type="range"
              min={1}
              max={Math.min(5, accounts.length || 1)}
              value={browsersCount}
              onChange={(e) => setBrowsersCount(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>1</span>
              <span>{Math.min(5, accounts.length || 1)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || selectedAccounts.length === 0}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting campaign...' : 'Start Campaign'}
          </button>
        </form>
      </main>
    </div>
  )
}

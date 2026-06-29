'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar, { Skeleton } from '@/components/Sidebar'

interface Account {
  id: string
  email: string
  username: string
  status: string
  tweetCount: number
  createdAt: string
}

const clientLinks = (active: string) => [
  { href: '/dashboard', label: 'Dashboard', active: active === 'dashboard' },
  { href: '/accounts', label: 'Accounts', active: active === 'accounts' },
  { href: '/campaigns', label: 'Campaigns', active: active === 'campaigns' },
  { href: '/campaigns/new', label: 'New Campaign', active: active === 'new-campaign' },
]

export default function AccountsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const loadAccounts = useCallback(async (userId: string) => {
    const res = await fetch(`/api/accounts?userId=${userId}`)
    const data = await res.json()
    setAccounts(data.accounts ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    loadAccounts(u.id)
  }, [router, loadAccounts])

  useEffect(() => {
    if (!accountId) return
    const evtSource = new EventSource(`/api/stream?accountId=${accountId}`)
    evtSource.addEventListener('step', (e) => {
      const data = JSON.parse(e.data)
      setLogs((prev) => [...prev.slice(-50), `[${data.step}] ${data.message}`])
    })
    evtSource.addEventListener('complete', () => {
      evtSource.close()
      loadAccounts(user!.id)
    })
    evtSource.addEventListener('error', () => {
      evtSource.close()
    })
    return () => evtSource.close()
  }, [accountId, user, loadAccounts])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    setError('')
    setLogs([])
    try {
      const res = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAccountId(data.accountId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this account?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/accounts?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      await loadAccounts(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const statusColors: Record<string, string> = {
    READY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    WARMING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    CREATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    BANNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    EXPIRED: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  }

  return (
    <div className="flex flex-1">
      <Sidebar links={clientLinks('accounts')} />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : 'Create Account'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mb-4 rounded-lg bg-zinc-900 text-green-400 p-4 text-xs font-mono h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {loading ? (
          <Skeleton rows={4} className="mt-8" />
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No accounts yet</p>
            <p className="text-sm">Click &quot;Create Account&quot; to create your first X account automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 px-4 font-medium">@{acc.username}</td>
                    <td className="py-3 px-4 text-zinc-500">{acc.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[acc.status] ?? 'bg-zinc-100 text-zinc-800'}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">{acc.tweetCount}</td>
                    <td className="py-3 px-4 text-zinc-500">{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(acc.id)}
                        disabled={deleting === acc.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 transition-colors"
                      >
                        {deleting === acc.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

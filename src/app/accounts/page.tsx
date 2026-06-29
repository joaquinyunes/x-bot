'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Account {
  id: string
  email: string
  username: string
  status: string
  tweetCount: number
  createdAt: string
}

export default function AccountsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; role: string } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadAccounts = async (userId: string) => {
    const res = await fetch(`/api/accounts?userId=${userId}`)
    const data = await res.json()
    setAccounts(data.accounts ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    loadAccounts(u.id)
  }, [router])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      await loadAccounts(user.id)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-1">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-bold text-lg">x-bot</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</Link>
          <Link href="/accounts" className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium">Accounts</Link>
          <Link href="/campaigns" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Campaigns</Link>
          <Link href="/campaigns/new" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">New Campaign</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Account'}
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-4">Accounts are automatically warmed up after creation.</p>

        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No accounts yet. Click &quot;Create Account&quot; to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium">Username</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-3 px-4 font-medium">@{acc.username}</td>
                    <td className="py-3 px-4 text-zinc-500">{acc.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acc.status === 'READY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : acc.status === 'WARMING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : acc.status === 'BANNED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">{acc.tweetCount}</td>
                    <td className="py-3 px-4 text-zinc-500">{new Date(acc.createdAt).toLocaleDateString()}</td>
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

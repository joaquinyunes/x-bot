'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const adminLinks = [
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/clients/new', label: 'New Client', active: true },
]

export default function NewClientPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1">
      <Sidebar links={adminLinks} role="ADMIN" />

      <main className="flex-1 p-8 max-w-md">
        <h1 className="text-2xl font-bold mb-6">New Client</h1>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-100 dark:bg-green-900 p-4 text-sm text-green-800 dark:text-green-200">
              Client created successfully!
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
              <p className="text-sm"><span className="font-medium">Email:</span> {result.email}</p>
              <p className="text-sm"><span className="font-medium">Temporary password:</span> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{result.tempPassword}</code></p>
            </div>
            <button
              onClick={() => router.push('/admin/clients')}
              className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Back to clients
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

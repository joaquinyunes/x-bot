'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  email: string
  name: string
  createdAt: string
  _count: { accounts: number; campaigns: number }
}

export default function AdminClientsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return }

    fetch('/api/admin/clients')
      .then(r => r.json())
      .then(data => {
        setClients(data.clients ?? [])
        setLoading(false)
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('xbot_user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="flex flex-1">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="font-bold text-lg">x-bot Admin</h2>
        <nav className="space-y-2">
          <Link href="/admin/clients" className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium">Clients</Link>
          <Link href="/admin/clients/new" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">New Client</Link>
        </nav>
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Link
            href="/admin/clients/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
          >
            New Client
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No clients yet. Create your first client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Accounts</th>
                  <th className="text-left py-3 px-4 font-medium">Campaigns</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-3 px-4 font-medium">{client.name}</td>
                    <td className="py-3 px-4 text-zinc-500">{client.email}</td>
                    <td className="py-3 px-4">{client._count.accounts}</td>
                    <td className="py-3 px-4">{client._count.campaigns}</td>
                    <td className="py-3 px-4 text-zinc-500">{new Date(client.createdAt).toLocaleDateString()}</td>
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

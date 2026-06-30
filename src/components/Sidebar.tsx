'use client'

import Link from 'next/link'
import { useAuth } from '@/context/auth'

interface SidebarLink {
  href: string
  label: string
  active?: boolean
}

interface SidebarProps {
  links: SidebarLink[]
  role?: string
}

export default function Sidebar({ links, role }: SidebarProps) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
      <Link href={role === 'ADMIN' ? '/admin/clients' : '/dashboard'}>
        <h2 className="font-bold text-lg mb-6 hover:text-blue-600 transition-colors">
          {role === 'ADMIN' ? 'x-bot Admin' : 'x-bot'}
        </h2>
      </Link>

      <nav className="space-y-1 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              link.active
                ? 'bg-zinc-100 dark:bg-zinc-800 font-medium'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export function Skeleton({ className = '', rows = 3 }: { className?: string; rows?: number }) {
  const widths = [70, 85, 60, 90, 75]
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${widths[i % widths.length]}%` }} />
      ))}
    </div>
  )
}

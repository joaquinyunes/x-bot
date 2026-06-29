'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('xbot_user')
    if (stored) {
      const user = JSON.parse(stored)
      router.push(user.role === 'ADMIN' ? '/admin/clients' : '/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-zinc-500">Redirecting...</p>
    </div>
  )
}

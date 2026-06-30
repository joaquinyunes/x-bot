'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
    } else if (user.role === 'ADMIN') {
      router.push('/admin/clients')
    } else {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-zinc-500">Redirecting...</p>
    </div>
  )
}

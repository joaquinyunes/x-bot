'use client'

import { AuthProvider } from '@/context/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  )
}

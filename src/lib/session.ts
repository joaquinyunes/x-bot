import { cookies } from 'next/headers'
import { UnauthorizedError } from './errors'

export interface SessionUser {
  id: string
  email: string
  role: 'ADMIN' | 'CLIENT'
}

export async function getSession(): Promise<SessionUser> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    throw new UnauthorizedError('No session found')
  }

  try {
    const parsed = JSON.parse(sessionCookie) as SessionUser
    if (!parsed.id || !parsed.email || !parsed.role) {
      throw new UnauthorizedError('Invalid session')
    }
    return parsed
  } catch {
    throw new UnauthorizedError('Invalid session')
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession()
  if (user.role !== 'ADMIN') {
    throw new UnauthorizedError('Admin access required')
  }
  return user
}

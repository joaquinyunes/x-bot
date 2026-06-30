import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/seed', '/api/auth/me', '/_next', '/favicon.ico']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get('session')?.value
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  try {
    const user = JSON.parse(session)
    if (!user?.id || !user?.role) {
      throw new Error('Invalid session')
    }

    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      const dashUrl = request.nextUrl.clone()
      dashUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashUrl)
    }

    return NextResponse.next()
  } catch {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('session')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}

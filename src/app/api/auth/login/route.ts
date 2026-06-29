import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password ?? '')
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    response.cookies.set('session', JSON.stringify({
      id: user.id, email: user.email, role: user.role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 }
    )
  }
}

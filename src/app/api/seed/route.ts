import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { seedSchema } from '@/lib/validation/schemas'
import { handleApiError, ConflictError } from '@/lib/errors'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { requireAdmin } from '@/lib/session'

export async function POST(request: Request) {
  const rl = rateLimitMiddleware(request, { limit: 5, windowMs: 300_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (existingAdmin) {
      try { await requireAdmin() } catch {
        throw new ConflictError('Admin already exists')
      }
    }

    const body = await request.json()
    const parsed = seedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, password, name } = parsed.data
    const hashed = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        firebaseUid: `admin_${crypto.randomUUID()}`,
        email,
        name: name ?? 'Admin',
        password: hashed,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin created',
      email: admin.email,
    })
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

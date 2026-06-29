import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createClientSchema } from '@/lib/validation/schemas'

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { accounts: true, campaigns: true } },
    },
  })

  return NextResponse.json({ clients: users })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, name } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!'
    const hashed = await bcrypt.hash(tempPassword, 10)

    const user = await prisma.user.create({
      data: {
        firebaseUid: `local_${crypto.randomUUID()}`,
        email,
        name,
        password: hashed,
        role: 'CLIENT',
      },
    })

    return NextResponse.json({
      success: true,
      clientId: user.id,
      email: user.email,
      name: user.name,
      tempPassword,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create client' },
      { status: 500 }
    )
  }
}

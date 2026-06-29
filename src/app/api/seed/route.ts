import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { seedSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' })
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Seed failed' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const where: { userId: string; status?: string } = { userId }
  if (status) where.status = status

  const accounts = await prisma.account.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      status: true,
      tweetCount: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })

  return NextResponse.json({ accounts, total: accounts.length })
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId required' }, { status: 400 })
    }

    const account = await prisma.account.findFirst({
      where: { id, userId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (fs.existsSync(account.storagePath)) {
      fs.unlinkSync(account.storagePath)
    }

    await prisma.account.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}

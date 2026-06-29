import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const where: Record<string, unknown> = { userId }
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

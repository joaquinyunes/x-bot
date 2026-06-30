import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import { handleApiError } from '@/lib/errors'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: { userId: string; status?: string } = { userId: user.id }
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
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const account = await prisma.account.findFirst({
      where: { id, userId: user.id },
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
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

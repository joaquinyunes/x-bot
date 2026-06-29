import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createXAccount } from '@/lib/playwright/createAccount'
import { warmUpAccount } from '@/lib/playwright/warmUp'
import path from 'path'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sessionDir = path.join(process.cwd(), 'sessions')

    const result = await createXAccount(sessionDir)

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        email: result.email,
        passwordMail: result.passwordMail,
        username: result.username,
        passwordX: result.passwordX,
        storagePath: result.storagePath,
        status: 'WARMING',
      },
    })

    warmUpAccount(result.storagePath, (event) => {
      console.log(`[warmup ${account.id}] ${event.step}: ${event.message}`)
    })
      .then(async () => {
        await prisma.account.update({
          where: { id: account.id },
          data: { status: 'READY' },
        })
      })
      .catch(async (err) => {
        console.error(`[warmup ${account.id}] failed:`, err)
        await prisma.account.update({
          where: { id: account.id },
          data: { status: 'READY' },
        })
      })

    return NextResponse.json({
      success: true,
      accountId: account.id,
      email: result.email,
      username: result.username,
      status: 'WARMING',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Account creation failed' },
      { status: 500 }
    )
  }
}

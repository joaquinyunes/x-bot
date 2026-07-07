import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createXAccount } from '@/lib/playwright/createAccount'
import { warmUpAccount } from '@/lib/playwright/warmUp'
import { handleApiError } from '@/lib/errors'
import { getSession } from '@/lib/session'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import path from 'path'

export const maxDuration = 300

export async function POST(request: Request) {
  const rl = rateLimitMiddleware(request, { limit: 3, windowMs: 300_000, keyPrefix: 'create-account' })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const user = await getSession()
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

    warmUpAccount(account.id, result.storagePath)
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
          data: { status: 'FAILED' },
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
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCampaign } from '@/lib/playwright/campaign'
import { createCampaignSchema } from '@/lib/validation/schemas'
import { sseManager } from '@/lib/sse/manager'
import { handleApiError } from '@/lib/errors'
import { getSession } from '@/lib/session'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export const maxDuration = 600

export async function POST(request: Request) {
  const rl = rateLimitMiddleware(request, { limit: 3, windowMs: 600_000, keyPrefix: 'campaign' })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const user = await getSession()
    const body = await request.json()
    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { accountIds, urls, comments, commentsPerUrl, browsersCount } = parsed.data as {
      accountIds: string[]
      urls: string[]
      comments: string[]
      commentsPerUrl?: Record<string, string[]>
      browsersCount: number
    }

    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, userId: user.id, status: 'READY' },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No ready accounts found' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        urls: JSON.stringify(urls),
        comments: JSON.stringify(comments),
        browsersCount: Math.min(browsersCount, accounts.length),
        status: 'RUNNING',
      },
    })

    const selectedAccounts = accounts.slice(0, campaign.browsersCount)

    Promise.all(
      selectedAccounts.map((account) =>
        executeCampaign({
          campaignId: campaign.id,
          accountId: account.id,
          storagePath: account.storagePath,
          urls,
          comments,
          commentsPerUrl,
        })
          .then(async () => {
            await prisma.account.update({
              where: { id: account.id },
              data: {
                lastUsedAt: new Date(),
                tweetCount: { increment: urls.length * 3 },
              },
            })
          })
          .catch(async (err) => {
            sseManager.emitCampaignEvent(campaign.id, 'error', {
              accountId: account.id,
              message: err.message,
            })
          })
      )
    )
      .then(async () => {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED', finishedAt: new Date() },
        })
        sseManager.emitCampaignEvent(campaign.id, 'complete', {
          message: 'Campaña finalizada',
          status: 'COMPLETED',
        })
      })
      .catch(async () => {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'FAILED', finishedAt: new Date() },
        })
      })

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      accountsCount: selectedAccounts.length,
    })
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSession()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          campaignLogs: {
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: { account: { select: { username: true } } },
          },
        },
      })
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      return NextResponse.json({ campaign })
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { campaignLogs: true } } },
    })

    return NextResponse.json({ campaigns })
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

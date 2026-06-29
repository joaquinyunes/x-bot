import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCampaign } from '@/lib/playwright/campaign'
import { createCampaignSchema } from '@/lib/validation/schemas'
import { sseManager } from '@/lib/sse/manager'

export const maxDuration = 600

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { userId, accountIds, urls, comments, commentsPerUrl, browsersCount } = parsed.data

    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, userId, status: 'READY' },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No ready accounts found' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Campaign creation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
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

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { campaignLogs: true } } },
  })

  return NextResponse.json({ campaigns })
}

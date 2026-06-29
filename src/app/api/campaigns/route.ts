import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeCampaign } from '@/lib/playwright/campaign'

export const maxDuration = 600

export async function POST(request: Request) {
  try {
    const { userId, accountIds, urls, comments, browsersCount } = await request.json()

    if (!userId || !accountIds?.length || !urls?.length) {
      return NextResponse.json(
        { error: 'userId, accountIds, and urls required' },
        { status: 400 }
      )
    }

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
        comments: JSON.stringify(comments ?? []),
        browsersCount: Math.min(browsersCount ?? accounts.length, accounts.length),
        status: 'RUNNING',
      },
    })

    const selectedAccounts = accounts.slice(0, campaign.browsersCount)

    Promise.all(
      selectedAccounts.map((account) =>
        executeCampaign({
          accountId: account.id,
          storagePath: account.storagePath,
          urls,
          comments: comments ?? [],
        })
          .then(async (results) => {
            for (const r of results) {
              if (r.type === 'action') {
                await prisma.campaignLog.create({
                  data: {
                    campaignId: campaign.id,
                    accountId: account.id,
                    url: r.url ?? urls[0],
                    round: r.round ?? 1,
                    action: r.action ?? 'unknown',
                    success: r.success ?? false,
                    errorMessage: r.message,
                  },
                })
              }
            }
          })
          .catch(async (err) => {
            await prisma.campaignLog.create({
              data: {
                campaignId: campaign.id,
                accountId: account.id,
                url: urls[0],
                round: 0,
                action: 'error',
                success: false,
                errorMessage: err.message,
              },
            })
          })
      )
    )
      .then(async () => {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED', finishedAt: new Date() },
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

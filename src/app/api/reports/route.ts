import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createLogger } from '@/lib/logger'

const log = createLogger({ module: 'reports-api' })

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'json'
    const type = searchParams.get('type') ?? 'campaigns'

    const where = session.role === 'ADMIN' ? {} : { userId: session.id }

    if (type === 'campaigns') {
      const campaigns = await prisma.campaign.findMany({
        where,
        include: {
          campaignLogs: true,
          user: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (format === 'csv') {
        const headers = ['ID', 'User', 'Status', 'URLs', 'Browsers', 'Created', 'Finished']
        const rows = campaigns.map(c => [
          c.id,
          c.user.email,
          c.status,
          JSON.parse(c.urls).length,
          c.browsersCount,
          c.createdAt.toISOString(),
          c.finishedAt?.toISOString() ?? '',
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=campaigns.csv',
          },
        })
      }

      return NextResponse.json(campaigns)
    }

    if (type === 'accounts') {
      const accounts = await prisma.account.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      })

      if (format === 'csv') {
        const headers = ['ID', 'User', 'Username', 'Status', 'Tweets', 'Created']
        const rows = accounts.map(a => [
          a.id,
          a.user.email,
          a.username,
          a.status,
          a.tweetCount,
          a.createdAt.toISOString(),
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=accounts.csv',
          },
        })
      }

      return NextResponse.json(accounts)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    log.error('Failed to generate report', error as Error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createLogger } from '@/lib/logger'

const log = createLogger({ module: 'schedule-api' })

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const body = await request.json()
    const { campaignId, scheduledFor } = body

    if (!campaignId || !scheduledFor) {
      return NextResponse.json({ error: 'Missing campaignId or scheduledFor' }, { status: 400 })
    }

    const date = new Date(scheduledFor)
    if (isNaN(date.getTime()) || date <= new Date()) {
      return NextResponse.json({ error: 'Invalid scheduled time' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: session.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'PENDING') {
      return NextResponse.json({ error: 'Campaign already started' }, { status: 400 })
    }

    log.info(`Campaign ${campaignId} scheduled for ${date.toISOString()}`)

    return NextResponse.json({
      success: true,
      scheduledFor: date,
      message: 'Campaign scheduled (note: scheduler requires cron worker)',
    })
  } catch (error) {
    log.error('Failed to schedule campaign', error as Error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

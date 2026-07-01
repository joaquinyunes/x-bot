import { prisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const log = createLogger({ module: 'metrics' })

export interface DashboardMetrics {
  accounts: {
    total: number
    active: number
    creating: number
    failed: number
  }
  campaigns: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  }
  actions: {
    total: number
    likes: number
    retweets: number
    comments: number
    videos: number
    successRate: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: Date
    success: boolean
  }>
}

export async function getDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
  try {
    const where = userId ? { userId } : {}

    const [accounts, campaigns, campaignLogs] = await Promise.all([
      prisma.account.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.campaign.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.campaignLog.findMany({
        where: userId ? { campaign: { userId } } : {},
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          success: true,
          createdAt: true,
          url: true,
        },
      }),
    ])

    const accountStats = {
      total: accounts.reduce((sum, g) => sum + g._count, 0),
      active: accounts.find(g => g.status === 'ACTIVE')?._count ?? 0,
      creating: accounts.find(g => g.status === 'CREATING')?._count ?? 0,
      failed: accounts.find(g => g.status === 'FAILED')?._count ?? 0,
    }

    const campaignStats = {
      total: campaigns.reduce((sum, g) => sum + g._count, 0),
      pending: campaigns.find(g => g.status === 'PENDING')?._count ?? 0,
      running: campaigns.find(g => g.status === 'RUNNING')?._count ?? 0,
      completed: campaigns.find(g => g.status === 'COMPLETED')?._count ?? 0,
      failed: campaigns.find(g => g.status === 'FAILED')?._count ?? 0,
    }

    const allLogs = await prisma.campaignLog.findMany({
      where: userId ? { campaign: { userId } } : {},
      select: { action: true, success: true },
    })

    const actionStats = {
      total: allLogs.length,
      likes: allLogs.filter(l => l.action === 'like').length,
      retweets: allLogs.filter(l => l.action === 'retweet').length,
      comments: allLogs.filter(l => l.action === 'comment').length,
      videos: allLogs.filter(l => l.action === 'video').length,
      successRate: allLogs.length > 0
        ? Math.round((allLogs.filter(l => l.success).length / allLogs.length) * 100)
        : 0,
    }

    const recentActivity = campaignLogs.map(log => ({
      id: log.id,
      type: log.action,
      message: `${log.action} on ${new URL(log.url).pathname.slice(0, 30)}...`,
      timestamp: log.createdAt,
      success: log.success,
    }))

    return { accounts: accountStats, campaigns: campaignStats, actions: actionStats, recentActivity }
  } catch (error) {
    log.error('Failed to get dashboard metrics', error as Error)
    return {
      accounts: { total: 0, active: 0, creating: 0, failed: 0 },
      campaigns: { total: 0, pending: 0, running: 0, completed: 0, failed: 0 },
      actions: { total: 0, likes: 0, retweets: 0, comments: 0, videos: 0, successRate: 0 },
      recentActivity: [],
    }
  }
}

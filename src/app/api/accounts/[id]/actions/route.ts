import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createContext } from '@/lib/playwright/browser'
import { likePost, retweetPost, commentPost } from '@/lib/playwright/actions'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { url, action, commentText } = await request.json()

    if (!url || !action) {
      return NextResponse.json({ error: 'url and action required' }, { status: 400 })
    }

    const account = await prisma.account.findUnique({ where: { id } })
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    if (account.status !== 'READY') {
      return NextResponse.json({ error: `Account status: ${account.status}` }, { status: 400 })
    }

    const context = await createContext(account.storagePath)
    const page = await context.newPage()

    try {
      let success = false

      switch (action) {
        case 'like':
          success = await likePost(page, url)
          break
        case 'retweet':
          success = await retweetPost(page, url)
          break
        case 'comment':
          success = await commentPost(page, url, commentText ?? '')
          break
        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
      }

      await prisma.account.update({
        where: { id },
        data: {
          lastUsedAt: new Date(),
          tweetCount: { increment: 1 },
        },
      })

      return NextResponse.json({ success })
    } finally {
      await page.close()
      await context.close()
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Action failed' },
      { status: 500 }
    )
  }
}

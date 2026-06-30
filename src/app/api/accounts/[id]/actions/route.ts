import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createContext } from '@/lib/playwright/browser'
import { likePost, retweetPost, commentPost } from '@/lib/playwright/actions'
import { actionSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/errors'
import { getSession } from '@/lib/session'

export const maxDuration = 120

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    const { id } = await params
    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { url, action, commentText } = parsed.data

    const account = await prisma.account.findFirst({ where: { id, userId: user.id } })
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    if (account.status !== 'READY') {
      return NextResponse.json({ error: `Account status: ${account.status}` }, { status: 400 })
    }

    const { browser, context } = await createContext(account.storagePath)
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
      await browser.close()
    }
  } catch (err) {
    const { error, status } = handleApiError(err)
    return NextResponse.json({ error }, { status })
  }
}

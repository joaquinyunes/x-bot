import { createContext } from './browser'
import { likePost, retweetPost, commentPost, playVideoForSeconds, reloadPost } from './actions'
import { randomDelay } from '@/lib/utils/randomizer'

interface CampaignConfig {
  accountId: string
  storagePath: string
  urls: string[]
  comments: string[]
  onEvent?: (
    event: CampaignEvent
  ) => void
}

interface CampaignEvent {
  type: 'action' | 'round' | 'error'
  accountId: string
  url?: string
  round?: number
  action?: string
  success?: boolean
  message?: string
}

export async function executeCampaign(config: CampaignConfig) {
  const { accountId, storagePath, urls, comments, onEvent } = config
  const results: CampaignEvent[] = []

  const context = await createContext(storagePath)
  const page = await context.newPage()

  const emit = (event: CampaignEvent) => {
    results.push(event)
    onEvent?.(event)
  }

  try {
    for (const url of urls) {
      for (let round = 1; round <= 3; round++) {
        emit({
          type: 'round',
          accountId,
          url,
          round,
          message: `Ronda ${round}/3 para ${url}`,
        })

        if (round === 1) {
          const liked = await likePost(page, url)
          emit({
            type: 'action',
            accountId, url, round, action: 'like', success: liked,
          })
          await randomDelay(2000, 4000)

          const retweeted = await retweetPost(page, url)
          emit({
            type: 'action',
            accountId, url, round, action: 'retweet', success: retweeted,
          })
          await randomDelay(2000, 4000)
        }

        if (comments.length > 0) {
          const commentIndex =
            round === 1
              ? 0
              : round === 2
                ? Math.min(1, comments.length - 1)
                : Math.min(2, comments.length - 1)
          const commented = await commentPost(page, url, comments[commentIndex])
          emit({
            type: 'action',
            accountId,
            url,
            round,
            action: 'comment',
            success: commented,
            message: comments[commentIndex],
          })
          await randomDelay(2000, 4000)
        }

        const videoPlayed = await playVideoForSeconds(page, url, 10)
        emit({
          type: 'action',
          accountId,
          url,
          round,
          action: 'video',
          success: videoPlayed,
        })
        await randomDelay(1000, 2000)

        await reloadPost(page, url)
        emit({
          type: 'action',
          accountId, url, round, action: 'reload', success: true,
        })
        await randomDelay(3000, 5000)
      }
    }
  } catch (err) {
    emit({
      type: 'error',
      accountId,
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  } finally {
    await page.close()
    await context.close()
  }

  return results
}

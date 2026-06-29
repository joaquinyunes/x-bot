import { createContext } from './browser'
import {
  likePost, retweetPost, commentPost,
  playVideoForSeconds, reloadPost,
} from './actions'
import { randomDelay } from '@/lib/utils/randomizer'
import { sseManager } from '@/lib/sse/manager'

interface CampaignConfig {
  campaignId: string
  accountId: string
  storagePath: string
  urls: string[]
  comments: string[]
  commentsPerUrl?: Record<string, string[]>
}

export async function executeCampaign(config: CampaignConfig) {
  const {
    campaignId, accountId, storagePath, urls, comments, commentsPerUrl,
  } = config

  const emit = (action: string, data: Record<string, unknown>) => {
    sseManager.emitCampaignEvent(campaignId, action, {
      accountId, ...data,
    })
  }

  const { browser, context } = await createContext(storagePath)
  const page = await context.newPage()

  let globalCommentIndex = 0

  try {
    for (const url of urls) {
      const urlComments = commentsPerUrl?.[url] ?? comments

      for (let round = 1; round <= 3; round++) {
        emit('round', { url, round, message: `Ronda ${round}/3` })

        if (round === 1) {
          const liked = await likePost(page, url)
          emit('action', { url, round, action: 'like', success: liked })
          await randomDelay(2000, 4000)

          const retweeted = await retweetPost(page, url)
          emit('action', { url, round, action: 'retweet', success: retweeted })
          await randomDelay(2000, 4000)
        }

        if (urlComments.length > 0) {
          const commentIndex = globalCommentIndex % urlComments.length
          const commentText = urlComments[commentIndex]
          globalCommentIndex++

          const commented = await commentPost(page, url, commentText)
          emit('action', {
            url, round, action: 'comment', success: commented, text: commentText,
          })
          await randomDelay(2000, 4000)
        }

        const videoPlayed = await playVideoForSeconds(page, url, 10)
        emit('action', { url, round, action: 'video', success: videoPlayed })
        await randomDelay(1000, 2000)

        await reloadPost(page, url)
        emit('action', { url, round, action: 'reload', success: true })
        await randomDelay(3000, 5000)
      }
    }

    emit('complete', { message: 'Campaña completada' })
  } catch (err) {
    emit('error', {
      message: err instanceof Error ? err.message : 'Error desconocido',
    })
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }
}

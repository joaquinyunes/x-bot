import { type Page } from 'playwright'
import { randomDelay } from '@/lib/utils/randomizer'

async function gotoPost(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await randomDelay(2000, 4000)
}

export async function likePost(page: Page, url: string): Promise<boolean> {
  await gotoPost(page, url)

  for (let attempt = 0; attempt < 3; attempt++) {
    const likeBtn = page.locator('[data-testid="like"]').first()
    if (await likeBtn.isVisible().catch(() => false)) {
      await likeBtn.click()
      await randomDelay(1000, 2000)
      return true
    }
    const unlikeBtn = page.locator('[data-testid="unlike"]').first()
    if (await unlikeBtn.isVisible().catch(() => false)) {
      return true
    }
    await randomDelay(2000, 4000)
  }
  return false
}

export async function retweetPost(page: Page, url: string): Promise<boolean> {
  await gotoPost(page, url)

  for (let attempt = 0; attempt < 3; attempt++) {
    const retweetBtn = page.locator('[data-testid="retweet"]').first()
    if (!(await retweetBtn.isVisible().catch(() => false))) {
      await randomDelay(2000, 4000)
      continue
    }

    await retweetBtn.click()
    await randomDelay(1000, 2000)

    const confirmBtn = page.locator('[data-testid="retweetConfirm"]')
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click()
      await randomDelay(1000, 2000)
      return true
    }
  }
  return false
}

export async function commentPost(
  page: Page,
  url: string,
  text: string
): Promise<boolean> {
  await gotoPost(page, url)

  for (let attempt = 0; attempt < 3; attempt++) {
    const replyBtn = page.locator('[data-testid="reply"]').first()
    if (await replyBtn.isVisible().catch(() => false)) {
      await replyBtn.click()
      await randomDelay(1500, 3000)
    }

    const editor = page.locator('[data-testid="tweetTextarea_0"]')
    const altEditor = page.locator('.public-DraftEditor-content')

    const editorVisible = await editor.isVisible().catch(() => false)
    const altVisible = await altEditor.isVisible().catch(() => false)

    if (!editorVisible && !altVisible) {
      await randomDelay(2000, 4000)
      continue
    }

    if (editorVisible) {
      await editor.click()
      await editor.fill(text)
    } else {
      await altEditor.click()
      await altEditor.fill(text)
    }

    await randomDelay(1000, 2000)

    const tweetBtn = page.locator('[data-testid="tweetButton"]')
    if (await tweetBtn.isVisible().catch(() => false)) {
      await tweetBtn.click()
      await randomDelay(1500, 3000)
      return true
    }
  }
  return false
}

export async function playVideoForSeconds(
  page: Page,
  url: string,
  seconds: number
): Promise<boolean> {
  await gotoPost(page, url)

  const video = page.locator('video')
  if (!(await video.isVisible().catch(() => false))) return false

  await video.hover()
  await randomDelay(500, 1000)

  const playBtn = page.locator('[data-testid="playButton"]')
  if (await playBtn.isVisible().catch(() => false)) {
    await playBtn.click()
  } else {
    await video.click()
  }

  await page.waitForTimeout(seconds * 1000)
  return true
}

export async function reloadPost(page: Page, url: string): Promise<void> {
  await gotoPost(page, url)
}

import { type Page } from 'playwright'
import { randomDelay } from '@/lib/utils/randomizer'

export async function likePost(page: Page, url: string): Promise<boolean> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await randomDelay(2000, 4000)

  const likeBtn = page.locator('[data-testid="like"]')
  if (!(await likeBtn.isVisible().catch(() => false))) return false

  await likeBtn.click()
  await randomDelay(1000, 2000)
  return true
}

export async function retweetPost(page: Page, url: string): Promise<boolean> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await randomDelay(2000, 4000)

  const retweetBtn = page.locator('[data-testid="retweet"]')
  if (!(await retweetBtn.isVisible().catch(() => false))) return false

  await retweetBtn.click()
  await randomDelay(1000, 2000)

  const confirmBtn = page.locator('[data-testid="retweetConfirm"]')
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click()
    await randomDelay(1000, 2000)
  }

  return true
}

export async function commentPost(
  page: Page,
  url: string,
  text: string
): Promise<boolean> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await randomDelay(2000, 4000)

  const replyBtn = page.locator('[data-testid="reply"]')
  if (await replyBtn.isVisible().catch(() => false)) {
    await replyBtn.click()
    await randomDelay(1000, 2000)
  }

  const editor = page.locator('[data-testid="tweetTextarea_0"]')
  if (!(await editor.isVisible().catch(() => false))) {
    const altEditor = page.locator('.public-DraftEditor-content')
    if (!(await altEditor.isVisible().catch(() => false))) return false
    await altEditor.click()
    await altEditor.fill(text)
  } else {
    await editor.click()
    await editor.fill(text)
  }

  await randomDelay(1000, 2000)

  const tweetBtn = page.locator('[data-testid="tweetButton"]')
  if (!(await tweetBtn.isVisible().catch(() => false))) return false

  await tweetBtn.click()
  await randomDelay(1000, 2000)
  return true
}

export async function playVideoForSeconds(
  page: Page,
  url: string,
  seconds: number
): Promise<boolean> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await randomDelay(2000, 4000)

  const video = page.locator('video')
  if (!(await video.isVisible().catch(() => false))) return false

  await video.hover()
  await randomDelay(500, 1000)

  const playBtn = page.locator('[data-testid="playButton"]')
  if (await playBtn.isVisible().catch(() => false)) {
    await playBtn.click()
  }

  await page.waitForTimeout(seconds * 1000)
  return true
}

export async function reloadPost(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' })
  await randomDelay(2000, 4000)
}

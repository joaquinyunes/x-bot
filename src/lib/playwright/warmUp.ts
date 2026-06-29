import { createContext } from './browser'
import { randomDelay } from '@/lib/utils/randomizer'
import { sseManager } from '@/lib/sse/manager'

export async function warmUpAccount(
  accountId: string,
  storagePath: string
): Promise<void> {
  const emit = (step: string, message: string) => {
    sseManager.emitAccountEvent(accountId, 'step', { step, message })
  }

  const { browser, context } = await createContext(storagePath)
  const page = await context.newPage()

  try {
    emit('navigating_home', 'Navegando al timeline...')
    await page.goto('https://x.com/home', { waitUntil: 'networkidle', timeout: 30000 })
    await randomDelay(3000, 5000)

    emit('scrolling', 'Haciendo scroll...')
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 600))
      await randomDelay(2000, 4000)
    }

    const likeButtons = page.locator('[data-testid="like"]')
    const likeCount = await likeButtons.count()
    const likesToDo = Math.min(likeCount, 3)

    for (let i = 0; i < likesToDo; i++) {
      try {
        await likeButtons.nth(i).click({ timeout: 5000 })
        emit('liking', `Like #${i + 1} de ${likesToDo}`)
        await randomDelay(3000, 6000)
      } catch {}
    }

    const followButtons = page.locator(
      '[data-testid*="follow"], [aria-label*="Follow"]'
    )
    const followCount = await followButtons.count()
    if (followCount > 0) {
      try {
        await followButtons.first().click({ timeout: 5000 })
        emit('following', 'Siguiendo una cuenta aleatoria')
        await randomDelay(3000, 5000)
      } catch {}
    }

    await randomDelay(5000, 10000)

    emit('saving_session', 'Guardando sesión...')
    await context.storageState({ path: storagePath })

    emit('warmup_complete', 'Calentamiento completado')
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }
}

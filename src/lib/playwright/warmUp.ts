import { createContext } from './browser'
import { randomDelay } from '@/lib/utils/randomizer'

type WarmUpCallback = (event: { step: string; message: string }) => void

export async function warmUpAccount(
  storagePath: string,
  onEvent?: WarmUpCallback
): Promise<void> {
  const context = await createContext(storagePath)
  const page = await context.newPage()

  try {
    emit(onEvent, 'navigating_home', 'Navegando al timeline...')
    await page.goto('https://x.com/home', { waitUntil: 'networkidle' })
    await randomDelay(3000, 5000)

    emit(onEvent, 'scrolling', 'Haciendo scroll en el timeline...')
    await page.evaluate(() => window.scrollBy(0, 800))
    await randomDelay(2000, 4000)
    await page.evaluate(() => window.scrollBy(0, 800))
    await randomDelay(2000, 4000)

    const likeButtons = page.locator('[data-testid="like"]')
    const likeCount = await likeButtons.count()
    const likesToDo = Math.min(likeCount, 3)

    for (let i = 0; i < likesToDo; i++) {
      try {
        await likeButtons.nth(i).click({ timeout: 5000 })
        emit(onEvent, 'liking', `Dando like #${i + 1}...`)
        await randomDelay(3000, 6000)
      } catch {
        // Element might have moved, skip
      }
    }

    const followButtons = page.locator('[data-testid*="follow"]')
    const followCount = await followButtons.count()
    if (followCount > 0) {
      try {
        await followButtons.first().click({ timeout: 5000 })
        emit(onEvent, 'following', 'Siguiendo una cuenta...')
        await randomDelay(3000, 5000)
      } catch {
        // skip
      }
    }

    await randomDelay(5000, 10000)

    emit(onEvent, 'saving_session', 'Guardando sesión actualizada...')
    await context.storageState({ path: storagePath })

    emit(onEvent, 'warmup_complete', 'Calentamiento completado.')
  } finally {
    await page.close()
    await context.close()
  }
}

function emit(cb: WarmUpCallback | undefined, step: string, message: string) {
  cb?.({ step, message })
}

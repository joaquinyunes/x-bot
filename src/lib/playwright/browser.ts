import { chromium, type Browser, type BrowserContext } from 'playwright'
import { getStealthConfig } from '@/lib/utils/stealth'

const browsers: Browser[] = []

export async function createBrowser(): Promise<Browser> {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  })
  browsers.push(browser)
  return browser
}

export async function createContext(storagePath?: string): Promise<{
  browser: Browser
  context: BrowserContext
}> {
  const browser = await createBrowser()
  const config = getStealthConfig()

  const context = await browser.newContext({
    ...config,
    storageState: storagePath ?? undefined,
  })

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  return { browser, context }
}

export async function closeAllBrowsers(): Promise<void> {
  for (const b of browsers) {
    try { await b.close() } catch {}
  }
  browsers.length = 0
}

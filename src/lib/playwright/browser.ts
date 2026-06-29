import { chromium, type Browser, type BrowserContext } from 'playwright'
import { getStealthConfig } from '@/lib/utils/stealth'

let browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    })
  }
  return browser
}

export async function createContext(storagePath?: string): Promise<BrowserContext> {
  const b = await getBrowser()
  const config = getStealthConfig()

  const context = await b.newContext({
    ...config,
    storageState: storagePath ?? undefined,
  })

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  return context
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
  }
}

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
      '--disable-infobars',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
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
    permissions: ['geolocation'],
    geolocation: {
      latitude: 40.4168 + (Math.random() - 0.5) * 0.1,
      longitude: -3.7038 + (Math.random() - 0.5) * 0.1,
    },
  })

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })

    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    })

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' },
      ],
    })

    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters)

    // @ts-expect-error chrome property
    window.chrome = { runtime: {} }
  })

  return { browser, context }
}

export async function closeAllBrowsers(): Promise<void> {
  for (const b of browsers) {
    try { await b.close() } catch {}
  }
  browsers.length = 0
}

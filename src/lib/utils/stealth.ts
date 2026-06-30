import type { BrowserContextOptions } from 'playwright'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Berlin',
  'Asia/Tokyo',
  'America/Sao_Paulo',
  'Europe/Paris',
]

const LOCALES = ['en-US', 'en-GB', 'es-ES', 'de-DE', 'fr-FR', 'pt-BR', 'ja-JP']

const SCREEN_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getStealthConfig(proxyUrl?: string): BrowserContextOptions {
  const screen = pick(SCREEN_SIZES)
  return {
    userAgent: pick(USER_AGENTS),
    viewport: {
      width: screen.width + Math.floor(Math.random() * 100 - 50),
      height: screen.height + Math.floor(Math.random() * 50 - 25),
    },
    screen: {
      width: screen.width,
      height: screen.height,
    },
    locale: pick(LOCALES),
    timezoneId: pick(TIMEZONES),
    deviceScaleFactor: pick([1, 1.25, 1.5, 2]),
    hasTouch: false,
    isMobile: false,
    ...(proxyUrl ? { proxy: { server: proxyUrl } } : {}),
  }
}

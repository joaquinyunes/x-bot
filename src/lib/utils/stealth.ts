import type { BrowserContextOptions } from 'playwright'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
]

export function getStealthConfig(): BrowserContextOptions {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

  return {
    userAgent: ua,
    viewport: {
      width: 1280 + Math.floor(Math.random() * 160),
      height: 720 + Math.floor(Math.random() * 180),
    },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7128, longitude: -74.006 },
  }
}

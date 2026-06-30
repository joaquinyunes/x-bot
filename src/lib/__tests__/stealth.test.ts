import { describe, it, expect } from 'vitest'
import { getStealthConfig } from '../utils/stealth'

describe('getStealthConfig', () => {
  it('should return a valid browser context config', () => {
    const config = getStealthConfig()

    expect(config.userAgent).toBeDefined()
    expect(typeof config.userAgent).toBe('string')
    expect(config.userAgent.length).toBeGreaterThan(0)

    expect(config.viewport).toBeDefined()
    expect(config.viewport!.width).toBeGreaterThanOrEqual(1200)
    expect(config.viewport!.height).toBeGreaterThanOrEqual(600)

    expect(config.locale).toBeDefined()
    expect(config.timezoneId).toBeDefined()
  })

  it('should include proxy when proxyUrl is provided', () => {
    const config = getStealthConfig('http://proxy:8080')
    expect(config.proxy).toEqual({ server: 'http://proxy:8080' })
  })

  it('should not include proxy when no proxyUrl is provided', () => {
    const config = getStealthConfig()
    expect(config.proxy).toBeUndefined()
  })

  it('should generate different configs on multiple calls', () => {
    const configs = new Set<string>()
    for (let i = 0; i < 20; i++) {
      configs.add(getStealthConfig().userAgent!)
    }
    expect(configs.size).toBeGreaterThan(1)
  })
})

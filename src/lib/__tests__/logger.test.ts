import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger, createLogger } from '../logger'

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  it('logs info messages', () => {
    logger.info('test message')
    expect(console.info).toHaveBeenCalled()
  })

  it('logs warn messages', () => {
    logger.warn('test warning')
    expect(console.warn).toHaveBeenCalled()
  })

  it('logs error messages', () => {
    logger.error('test error')
    expect(console.error).toHaveBeenCalled()
  })

  it('creates child logger with context', () => {
    const child = createLogger({ module: 'test' })
    child.info('child message')
    expect(console.info).toHaveBeenCalled()
  })
})

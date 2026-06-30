import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit } from '../rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests within the limit', () => {
    const result = rateLimit('test-key', { limit: 5, windowMs: 60000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should block requests exceeding the limit', () => {
    const key = 'block-test'
    for (let i = 0; i < 5; i++) {
      rateLimit(key, { limit: 5, windowMs: 60000 })
    }
    const result = rateLimit(key, { limit: 5, windowMs: 60000 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after the window expires', () => {
    const key = 'reset-test'
    rateLimit(key, { limit: 2, windowMs: 1000 })
    rateLimit(key, { limit: 2, windowMs: 1000 })
    const blocked = rateLimit(key, { limit: 2, windowMs: 1000 })
    expect(blocked.allowed).toBe(false)

    vi.advanceTimersByTime(1001)
    const allowed = rateLimit(key, { limit: 2, windowMs: 1000 })
    expect(allowed.allowed).toBe(true)
  })

  it('should track different keys independently', () => {
    const r1 = rateLimit('key-a', { limit: 1, windowMs: 60000 })
    expect(r1.allowed).toBe(true)
    const r2 = rateLimit('key-a', { limit: 1, windowMs: 60000 })
    expect(r2.allowed).toBe(false)
    const r3 = rateLimit('key-b', { limit: 1, windowMs: 60000 })
    expect(r3.allowed).toBe(true)
  })
})

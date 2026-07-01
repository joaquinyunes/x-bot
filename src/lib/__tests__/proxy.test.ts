import { describe, it, expect } from 'vitest'
import { ProxyRotator } from '../proxy-rotator'

describe('ProxyRotator', () => {
  it('returns null when no proxies loaded', () => {
    const rotator = new ProxyRotator()
    expect(rotator.getNext()).toBeNull()
  })

  it('loads proxies from config', () => {
    const rotator = new ProxyRotator()
    rotator.load([
      { server: 'http://proxy1:8080' },
      { server: 'http://proxy2:8080' },
    ])
    expect(rotator.getStats().total).toBe(2)
  })

  it('rotates through proxies', () => {
    const rotator = new ProxyRotator()
    rotator.load([
      { server: 'http://proxy1:8080' },
      { server: 'http://proxy2:8080' },
    ])

    const first = rotator.getNext()
    const second = rotator.getNext()
    expect(first?.server).not.toBe(second?.server)
  })

  it('skips failed proxies', () => {
    const rotator = new ProxyRotator()
    rotator.load([
      { server: 'http://proxy1:8080' },
      { server: 'http://proxy2:8080' },
    ])

    rotator.markFailed('http://proxy1:8080')
    rotator.markFailed('http://proxy1:8080')
    rotator.markFailed('http://proxy1:8080')

    const next = rotator.getNext()
    expect(next?.server).toBe('http://proxy2:8080')
  })
})

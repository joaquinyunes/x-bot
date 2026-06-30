import { describe, it, expect } from 'vitest'
import { sseManager } from '../sse/manager'

describe('SseManager', () => {
  it('should subscribe and receive events', () => {
    const received: unknown[] = []
    const unsub = sseManager.subscribe('test:1', (event) => {
      received.push(event)
    })

    sseManager.emit('test:1', 'hello', { msg: 'hi' })
    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ channel: 'test:1', type: 'hello', data: { msg: 'hi' } })

    unsub()
  })

  it('should unsubscribe correctly', () => {
    const received: unknown[] = []
    const unsub = sseManager.subscribe('test:2', (event) => {
      received.push(event)
    })

    sseManager.emit('test:2', 'msg', {})
    expect(received).toHaveLength(1)

    unsub()
    sseManager.emit('test:2', 'msg2', {})
    expect(received).toHaveLength(1)
  })

  it('should emit account events with correct channel', () => {
    const received: unknown[] = []
    const unsub = sseManager.subscribe('account:abc', (event) => {
      received.push(event)
    })

    sseManager.emitAccountEvent('abc', 'step', { message: 'creating' })
    expect(received).toHaveLength(1)
    expect((received[0] as { channel: string }).channel).toBe('account:abc')

    unsub()
  })

  it('should emit campaign events with correct channel', () => {
    const received: unknown[] = []
    const unsub = sseManager.subscribe('campaign:xyz', (event) => {
      received.push(event)
    })

    sseManager.emitCampaignEvent('xyz', 'action', { action: 'like' })
    expect(received).toHaveLength(1)
    expect((received[0] as { channel: string }).channel).toBe('campaign:xyz')

    unsub()
  })

  it('should track channel connection count', () => {
    const unsub1 = sseManager.subscribe('track:1', () => {})
    expect(sseManager.getChannelCount('track:1')).toBe(1)

    const unsub2 = sseManager.subscribe('track:1', () => {})
    expect(sseManager.getChannelCount('track:1')).toBe(2)

    unsub1()
    expect(sseManager.getChannelCount('track:1')).toBe(1)

    unsub2()
    expect(sseManager.getChannelCount('track:1')).toBe(0)
  })

  it('should handle errors in listeners gracefully', () => {
    const unsub = sseManager.subscribe('error:1', () => {
      throw new Error('listener error')
    })

    expect(() => {
      sseManager.emit('error:1', 'test', {})
    }).not.toThrow()

    unsub()
  })
})

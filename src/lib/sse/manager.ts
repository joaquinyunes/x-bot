type Listener = (event: SseEvent) => void

export interface SseEvent {
  channel: string
  type: string
  data: Record<string, unknown>
}

class SseManager {
  private listeners = new Map<string, Set<Listener>>()
  private connectionCounts = new Map<string, number>()

  subscribe(channel: string, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
      this.connectionCounts.set(channel, 0)
    }
    this.listeners.get(channel)!.add(listener)
    this.connectionCounts.set(channel, (this.connectionCounts.get(channel) ?? 0) + 1)

    return () => {
      this.listeners.get(channel)?.delete(listener)
      const count = (this.connectionCounts.get(channel) ?? 1) - 1
      this.connectionCounts.set(channel, count)
      if (count <= 0) {
        this.listeners.delete(channel)
        this.connectionCounts.delete(channel)
      }
    }
  }

  emit(channel: string, type: string, data: Record<string, unknown>) {
    const event: SseEvent = { channel, type, data }
    this.listeners.get(channel)?.forEach((listener) => {
      try { listener(event) } catch {}
    })
  }

  emitAccountEvent(accountId: string, type: string, data: Record<string, unknown>) {
    this.emit(`account:${accountId}`, type, { accountId, ...data })
  }

  emitCampaignEvent(campaignId: string, type: string, data: Record<string, unknown>) {
    this.emit(`campaign:${campaignId}`, type, { campaignId, ...data })
  }

  getChannelCount(channel: string): number {
    return this.connectionCounts.get(channel) ?? 0
  }
}

export const sseManager = new SseManager()

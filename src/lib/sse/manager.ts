type Listener = (event: SseEvent) => void

export interface SseEvent {
  channel: string
  type: string
  data: Record<string, unknown>
}

class SseManager {
  private listeners = new Map<string, Set<Listener>>()

  subscribe(channel: string, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(listener)

    return () => {
      this.listeners.get(channel)?.delete(listener)
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
}

export const sseManager = new SseManager()

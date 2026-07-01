import { createLogger } from '@/lib/logger'

const log = createLogger({ module: 'proxy-rotator' })

interface ProxyConfig {
  server: string
  username?: string
  password?: string
  lastUsed?: Date
  failCount: number
}

export class ProxyRotator {
  private proxies: ProxyConfig[] = []
  private currentIndex = 0

  load(configs: Array<{ server: string; username?: string; password?: string }>) {
    this.proxies = configs.map(c => ({
      ...c,
      failCount: 0,
    }))
    log.info(`Loaded ${this.proxies.length} proxies`)
  }

  loadFromEnv() {
    const raw = process.env.PROXY_LIST
    if (!raw) {
      log.warn('No PROXY_LIST env var found')
      return
    }

    const lines = raw.split('\n').filter(l => l.trim())
    this.proxies = lines.map(line => {
      const parts = line.split(':')
      const server = parts[0]
      const username = parts[1] || undefined
      const password = parts[2] || undefined
      return {
        server: server.startsWith('http') ? server : `http://${server}`,
        username,
        password,
        failCount: 0,
      }
    })

    log.info(`Loaded ${this.proxies.length} proxies from env`)
  }

  getNext(): ProxyConfig | null {
    if (this.proxies.length === 0) return null

    const startIdx = this.currentIndex
    while (true) {
      const proxy = this.proxies[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length

      if (proxy.failCount < 3) {
        proxy.lastUsed = new Date()
        return proxy
      }

      if (this.currentIndex === startIdx) {
        log.warn('All proxies failed, resetting')
        this.proxies.forEach(p => { p.failCount = 0 })
        return this.proxies[0]
      }
    }
  }

  markFailed(server: string) {
    const proxy = this.proxies.find(p => p.server === server)
    if (proxy) {
      proxy.failCount++
      log.warn(`Proxy ${server} failed (${proxy.failCount}/3)`)
    }
  }

  markSuccess(server: string) {
    const proxy = this.proxies.find(p => p.server === server)
    if (proxy) {
      proxy.failCount = Math.max(0, proxy.failCount - 1)
    }
  }

  getStats() {
    return {
      total: this.proxies.length,
      available: this.proxies.filter(p => p.failCount < 3).length,
      failed: this.proxies.filter(p => p.failCount >= 3).length,
    }
  }
}

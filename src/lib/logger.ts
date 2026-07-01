type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private context: Record<string, unknown>

  constructor(context: Record<string, unknown> = {}) {
    this.context = context
  }

  private format(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    const ctx = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : ''
    const err = entry.error ? `\n${entry.error.stack}` : ''
    return `${base}${ctx}${err}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error,
    }
    const formatted = this.format(entry)

    switch (level) {
      case 'debug': console.debug(formatted); break
      case 'info': console.info(formatted); break
      case 'warn': console.warn(formatted); break
      case 'error': console.error(formatted); break
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger({ ...this.context, ...context })
  }
}

export const logger = new Logger()
export function createLogger(context: Record<string, unknown>): Logger {
  return new Logger(context)
}

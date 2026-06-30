'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-red-600">Something went wrong</p>
            <p className="text-sm text-zinc-500">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

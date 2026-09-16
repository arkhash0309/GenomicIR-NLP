import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-genomic-rose">Something went wrong</h2>
          <p className="text-white/50 text-sm mb-6 max-w-sm">
            An unexpected error occurred. The error has been logged.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-lg text-sm hover:bg-genomic-cyan/90 transition-colors"
            >
              Try again
            </button>
            <Link
              to="/"
              className="px-4 py-2 glass rounded-lg text-sm text-white/60 hover:text-white transition-colors"
              onClick={() => this.setState({ error: null })}
            >
              Go home
            </Link>
          </div>
          <details className="mt-6 text-left max-w-lg">
            <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50">
              Error details
            </summary>
            <pre className="mt-2 text-red-400/70 text-xs bg-white/5 p-3 rounded-lg overflow-auto max-h-40 font-mono">
              {this.state.error.message}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

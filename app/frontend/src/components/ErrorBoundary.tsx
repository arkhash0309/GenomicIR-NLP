import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'

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
          className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <TriangleAlert size={28} className="mb-4 text-danger" aria-hidden="true" />
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-6 text-sm text-muted">An unexpected error occurred while rendering this page.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => this.setState({ error: null })} className="btn-primary">
              Try again
            </button>
            <Link to="/" className="btn-secondary" onClick={() => this.setState({ error: null })}>
              Go home
            </Link>
          </div>
          <details className="mt-6 w-full text-left">
            <summary className="cursor-pointer text-xs text-subtle hover:text-muted">Error details</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-danger">
              {this.state.error.message}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

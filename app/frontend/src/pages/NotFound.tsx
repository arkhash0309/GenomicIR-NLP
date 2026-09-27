import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center" aria-labelledby="not-found-heading">
      <p className="mb-2 font-mono text-sm text-subtle">404</p>
      <h1 id="not-found-heading" className="mb-2 text-xl font-semibold">Page not found</h1>
      <p className="mb-6 text-sm text-muted">This page doesn’t exist or has moved.</p>
      <div className="flex justify-center gap-2">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/search" className="btn-secondary">Search papers</Link>
      </div>
    </div>
  )
}

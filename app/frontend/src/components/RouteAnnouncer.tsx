import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const ROUTE_NAMES: Record<string, string> = {
  '/':        'Home',
  '/ask':     'Research Assistant',
  '/search':  'Hybrid Search',
  '/explore': 'Graph Explorer',
}

export default function RouteAnnouncer() {
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const name = ROUTE_NAMES[pathname] ?? 'Page'
    if (ref.current) {
      ref.current.textContent = ''
      setTimeout(() => {
        if (ref.current) ref.current.textContent = `Navigated to ${name}`
      }, 100)
    }
  }, [pathname])

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  )
}

// src/components/Nav.tsx
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/ask', label: 'Research Assistant' },
  { to: '/search', label: 'Search' },
  { to: '/explore', label: 'Graph Explorer' },
]

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gradient">GenomicIR</Link>
        <div className="flex gap-6">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-sm transition-colors ${pathname === l.to ? 'text-genomic-cyan font-medium' : 'text-white/60 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

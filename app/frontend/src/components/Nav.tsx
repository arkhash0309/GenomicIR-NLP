import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const links = [
  { to: '/',        label: 'Home' },
  { to: '/ask',     label: 'Research Assistant' },
  { to: '/search',  label: 'Search' },
  { to: '/explore', label: 'Graph Explorer' },
]

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Nav() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
         aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gradient"
              aria-label="GenomicIR — go to home page">
          GenomicIR
        </Link>

        <div className="flex items-center gap-2">
          <ul className="flex gap-1 list-none m-0 p-0" role="list">
            {links.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  aria-current={pathname === l.to ? 'page' : undefined}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                    pathname === l.to
                      ? 'text-genomic-cyan font-medium bg-genomic-cyan/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="ml-2 w-9 h-9 flex items-center justify-center rounded-lg glass hover:border-white/30 transition-colors text-white/60 hover:text-white"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </nav>
  )
}

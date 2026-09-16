import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFontSize, type FontSize } from '../contexts/FontSizeContext'

const NAV_LINKS = [
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  )
}

const FONT_LABELS: Record<FontSize, string> = { normal: 'A', large: 'A', xlarge: 'A' }
const FONT_SIZES:  Record<FontSize, string> = { normal: 'text-xs', large: 'text-sm', xlarge: 'text-base' }

export default function Nav() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { fontSize, setFontSize } = useFontSize()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMenu = () => setMobileOpen(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
         aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="text-lg font-semibold text-gradient shrink-0"
              aria-label="GenomicIR — go to home page"
              onClick={closeMenu}>
          GenomicIR
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden sm:flex gap-1 list-none m-0 p-0 flex-1" role="list">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                aria-current={pathname === l.to ? 'page' : undefined}
                className={`text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
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

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Font size control */}
          <div className="hidden sm:flex items-center glass rounded-lg overflow-hidden"
               role="group" aria-label="Text size">
            {(['normal', 'large', 'xlarge'] as FontSize[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                aria-label={`Set text size to ${s}`}
                aria-pressed={fontSize === s}
                className={`px-2 py-1.5 transition-colors font-semibold leading-none ${FONT_SIZES[s]} ${
                  fontSize === s
                    ? 'bg-genomic-cyan/20 text-genomic-cyan'
                    : 'text-white/40 hover:text-white/70'
                } ${i > 0 ? 'border-l border-white/10' : ''}`}
              >
                {FONT_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-9 h-9 flex items-center justify-center rounded-lg glass hover:border-white/30 transition-colors text-white/60 hover:text-white"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg glass hover:border-white/30 transition-colors text-white/60 hover:text-white"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="sm:hidden glass border-t border-white/10 px-4 py-4">
          <ul className="list-none m-0 p-0 flex flex-col gap-1" role="list">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={closeMenu}
                  aria-current={pathname === l.to ? 'page' : undefined}
                  className={`block text-sm px-3 py-2.5 rounded-lg transition-colors ${
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
          {/* Font size in mobile */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/30 text-xs mb-2 px-3">Text size</p>
            <div className="flex gap-2 px-3">
              {(['normal', 'large', 'xlarge'] as FontSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  aria-label={`Text size: ${s}`}
                  aria-pressed={fontSize === s}
                  className={`flex-1 py-2 rounded-lg text-center font-semibold transition-colors ${FONT_SIZES[s]} ${
                    fontSize === s
                      ? 'bg-genomic-cyan/20 text-genomic-cyan border border-genomic-cyan/30'
                      : 'glass text-white/40 hover:text-white/70'
                  }`}
                >
                  {s === 'normal' ? 'Normal' : s === 'large' ? 'Large' : 'X-Large'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

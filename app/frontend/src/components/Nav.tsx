import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

const FONT_SIZES: Record<FontSize, string> = { normal: 'text-xs', large: 'text-sm', xlarge: 'text-base' }

interface Props { onOpenShortcuts?: () => void }

export default function Nav({ onOpenShortcuts }: Props) {
  const { pathname } = useLocation()
  const { theme, toggle, highContrast, toggleHighContrast } = useTheme()
  const { fontSize, setFontSize } = useFontSize()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  /* Scroll-aware styling */
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 24))
    return unsub
  }, [scrollY])

  const closeMenu = () => setMobileOpen(false)
  useEffect(() => { closeMenu() }, [pathname])

  /* Focus trap */
  useEffect(() => {
    if (!mobileOpen) return
    const menu = menuRef.current
    if (!menu) return
    const focusables = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]
    const last  = focusables[focusables.length - 1]
    first?.focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus() } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus() } }
    }
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeMenu(); hamburgerRef.current?.focus() } }
    document.addEventListener('keydown', trap)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('keydown', trap); document.removeEventListener('keydown', escape) }
  }, [mobileOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(5,10,20,0.82)] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[58px] flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          to="/"
          className="text-base font-semibold tracking-[-0.01em] text-gradient-static shrink-0 hover:opacity-80 transition-opacity"
          aria-label="GenomicIR — go to home page"
        >
          GenomicIR
        </Link>

        {/* Desktop nav links — pill style */}
        <ul className="hidden sm:flex gap-0.5 list-none m-0 p-0 flex-1" role="list">
          {NAV_LINKS.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                aria-current={pathname === l.to ? 'page' : undefined}
                className={`relative text-[13px] px-3.5 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap ${
                  pathname === l.to
                    ? 'text-[var(--text-100)] font-medium'
                    : 'text-[var(--text-40)] hover:text-[var(--text-80,rgba(245,245,247,0.8))]'
                }`}
              >
                {pathname === l.to && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/8"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Font size */}
          <div className="hidden sm:flex items-center rounded-xl overflow-hidden border border-white/[0.08]"
               role="group" aria-label="Text size">
            {(['normal', 'large', 'xlarge'] as FontSize[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                aria-label={`Set text size to ${s}`}
                aria-pressed={fontSize === s}
                className={`px-2 py-1.5 transition-colors font-semibold leading-none ${FONT_SIZES[s]} ${
                  fontSize === s
                    ? 'bg-white/10 text-[var(--text-100)]'
                    : 'text-[var(--text-30)] hover:text-[var(--text-60)]'
                } ${i > 0 ? 'border-l border-white/[0.08]' : ''}`}
              >
                A
              </button>
            ))}
          </div>

          {/* High contrast */}
          <button
            onClick={toggleHighContrast}
            aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            aria-pressed={highContrast}
            className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-xl border transition-colors font-bold text-[10px] tracking-tight ${
              highContrast
                ? 'border-genomic-cyan/40 text-genomic-cyan bg-genomic-cyan/10'
                : 'border-white/[0.08] text-[var(--text-30)] hover:text-[var(--text-60)] hover:border-white/20'
            }`}
          >
            HC
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.08] hover:border-white/20 transition-colors text-[var(--text-40)] hover:text-[var(--text-70)]"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Keyboard shortcuts */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              aria-label="Open keyboard shortcuts (press ?)"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-xl border border-white/[0.08] hover:border-white/20 transition-colors text-[var(--text-30)] hover:text-[var(--text-60)] font-mono text-xs"
            >
              ?
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl border border-white/[0.08] hover:border-white/20 transition-colors text-[var(--text-50)] hover:text-[var(--text-80,rgba(245,245,247,0.8))]"
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
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden overflow-hidden border-t border-white/[0.06] bg-[rgba(5,10,20,0.92)] backdrop-blur-2xl"
          >
            <div className="px-5 py-5">
              <ul className="list-none m-0 p-0 flex flex-col gap-0.5" role="list">
                {NAV_LINKS.map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      onClick={closeMenu}
                      aria-current={pathname === l.to ? 'page' : undefined}
                      className={`block text-[14px] px-4 py-3 rounded-xl transition-colors ${
                        pathname === l.to
                          ? 'text-[var(--text-100)] font-medium bg-white/8'
                          : 'text-[var(--text-40)] hover:text-[var(--text-70)] hover:bg-white/4'
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-5 border-t border-white/[0.06]">
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-25)] mb-3 px-1">Text size</p>
                <div className="flex gap-2">
                  {(['normal', 'large', 'xlarge'] as FontSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFontSize(s)}
                      aria-label={`Text size: ${s}`}
                      aria-pressed={fontSize === s}
                      className={`flex-1 py-2.5 rounded-xl text-center font-semibold transition-all ${FONT_SIZES[s]} ${
                        fontSize === s
                          ? 'bg-white/10 text-[var(--text-100)] border border-white/15'
                          : 'border border-white/[0.08] text-[var(--text-30)] hover:text-[var(--text-60)]'
                      }`}
                    >
                      {s === 'normal' ? 'Normal' : s === 'large' ? 'Large' : 'X-Large'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={toggleHighContrast}
                  aria-pressed={highContrast}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    highContrast
                      ? 'bg-genomic-cyan/15 text-genomic-cyan border border-genomic-cyan/30'
                      : 'border border-white/[0.08] text-[var(--text-30)] hover:text-[var(--text-60)]'
                  }`}
                >
                  High contrast {highContrast ? 'ON' : 'OFF'}
                </button>
                {onOpenShortcuts && (
                  <button
                    onClick={() => { closeMenu(); onOpenShortcuts() }}
                    className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-[var(--text-30)] hover:text-[var(--text-60)] text-sm font-mono transition-colors"
                    aria-label="Open keyboard shortcuts"
                  >
                    ?
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

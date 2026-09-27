import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { Dna, Keyboard, Menu, SlidersHorizontal, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useFontSize, type FontSize } from '../contexts/FontSizeContext'
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from './ui/morphing-popover'
import ThemeSwitch from './ThemeSwitch'
import { cn } from '../lib/utils'

const NAV_LINKS = [
  { to: '/ask',     label: 'Ask' },
  { to: '/search',  label: 'Search' },
  { to: '/explore', label: 'Graph' },
]

const REPO_URL = 'https://github.com/arkhash0309/GenomicIR-NLP'

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'Default' },
  { value: 'large',  label: 'Large' },
  { value: 'xlarge', label: 'Larger' },
]

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

/** Text size + contrast preferences; shared by the desktop popover and the mobile menu. */
function DisplaySettings({ onOpenShortcuts }: { onOpenShortcuts?: () => void }) {
  const { highContrast, toggleHighContrast } = useTheme()
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow mb-2">Text size</p>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1" role="group" aria-label="Text size">
          {FONT_SIZES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setFontSize(s.value)}
              aria-pressed={fontSize === s.value}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                fontSize === s.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-fg">
        High contrast
        <input
          type="checkbox"
          checked={highContrast}
          onChange={toggleHighContrast}
          className="h-4 w-4 accent-[rgb(var(--accent))]"
        />
      </label>
      {onOpenShortcuts && (
        <button type="button" onClick={onOpenShortcuts} className="btn-ghost -mx-2 w-[calc(100%+1rem)] justify-between px-2">
          <span className="flex items-center gap-2"><Keyboard size={14} aria-hidden="true" /> Keyboard shortcuts</span>
          <kbd className="kbd">?</kbd>
        </button>
      )}
    </div>
  )
}

interface Props { onOpenShortcuts?: () => void }

export default function Nav({ onOpenShortcuts }: Props) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const menu = menuRef.current
    if (!menu) return
    const focusables = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input')
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); hamburgerRef.current?.focus(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const isActive = (to: string) => pathname === to || (to === '/search' && pathname.startsWith('/paper/'))

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-fg" aria-label="GenomicIR home">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
            <Dna size={16} aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">GenomicIR</span>
        </Link>

        {/* Sliding active pill — pattern from Watermelon UI "continuous-tabs". */}
        <LayoutGroup id="nav">
          <ul className="m-0 hidden list-none items-center gap-1 p-0 sm:flex" role="list">
            {NAV_LINKS.map(l => {
              const active = isActive(l.to)
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative block rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      active ? 'text-fg' : 'text-muted hover:text-fg',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md bg-surface-2"
                        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </LayoutGroup>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg sm:flex"
            aria-label="Source code on GitHub (opens in new tab)"
          >
            <GitHubMark />
          </a>

          <div className="hidden sm:block">
            <MorphingPopover>
              <MorphingPopoverTrigger
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Display settings"
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
              </MorphingPopoverTrigger>
              <MorphingPopoverContent className="right-0 top-0 w-64 p-4" aria-label="Display settings">
                <DisplaySettings onOpenShortcuts={onOpenShortcuts} />
              </MorphingPopoverContent>
            </MorphingPopover>
          </div>

          <ThemeSwitch />

          <button
            ref={hamburgerRef}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg sm:hidden"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line bg-canvas sm:hidden"
          >
            <div className="space-y-5 px-4 py-4">
              <ul className="m-0 list-none space-y-1 p-0" role="list">
                {NAV_LINKS.map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      aria-current={isActive(l.to) ? 'page' : undefined}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm font-medium',
                        isActive(l.to) ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href={REPO_URL} target="_blank" rel="noreferrer" className="block rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg">
                    GitHub
                  </a>
                </li>
              </ul>
              <div className="border-t border-line pt-4">
                <DisplaySettings
                  onOpenShortcuts={onOpenShortcuts && (() => { setMobileOpen(false); onOpenShortcuts() })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

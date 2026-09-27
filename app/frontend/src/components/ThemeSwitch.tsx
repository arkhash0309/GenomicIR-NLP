// Adapted from Watermelon UI "switch-mode" (https://ui.watermelon.sh), scaled
// down to nav size and wired to our ThemeContext instead of next-themes.
import { motion, useReducedMotion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitch() {
  const { theme, toggle } = useTheme()
  const reduced = useReducedMotion()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={toggle}
      className="relative flex h-8 w-[3.75rem] items-center rounded-full border border-line bg-surface-2 p-0.5"
    >
      <motion.span
        className="absolute top-0.5 h-[1.625rem] w-[1.625rem] rounded-full border border-line bg-surface shadow-sm"
        initial={false}
        animate={{ left: isDark ? 'calc(100% - 1.75rem)' : '0.125rem' }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 32 }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex w-full justify-between px-1.5" aria-hidden="true">
        <Sun size={14} className={isDark ? 'text-subtle' : 'text-fg'} />
        <Moon size={14} className={isDark ? 'text-fg' : 'text-subtle'} />
      </span>
    </button>
  )
}

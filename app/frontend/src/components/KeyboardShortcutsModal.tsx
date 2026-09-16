import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: '/', desc: 'Focus search / question input' },
  { key: '?', desc: 'Open keyboard shortcuts' },
  { key: 'Esc', desc: 'Close modal / dismiss overlay' },
  { key: '↵', desc: 'Submit current form or ask question' },
  { key: 'Tab', desc: 'Navigate between elements' },
  { key: 'Space / ↵', desc: 'Activate focused button or link' },
]

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 glass rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-base">Keyboard shortcuts</h2>
              <button
                onClick={onClose}
                aria-label="Close keyboard shortcuts"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <ul className="space-y-3 list-none p-0 m-0">
              {SHORTCUTS.map(s => (
                <li key={s.key} className="flex items-center justify-between gap-4">
                  <span className="text-white/60 text-sm">{s.desc}</span>
                  <kbd className="shrink-0 px-2 py-1 rounded-md bg-white/10 border border-white/15 font-mono text-xs text-white/80">
                    {s.key}
                  </kbd>
                </li>
              ))}
            </ul>

            <p className="mt-5 pt-4 border-t border-white/10 text-white/30 text-xs text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-xs text-white/50">Esc</kbd> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

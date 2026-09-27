import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['/'],   desc: 'Focus the search or question input' },
  { keys: ['↵'],   desc: 'Submit' },
  { keys: ['?'],   desc: 'Show keyboard shortcuts' },
  { keys: ['Esc'], desc: 'Close dialogs and popovers' },
]

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-canvas/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="card w-full max-w-sm p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="shortcuts-title" className="text-sm font-semibold">Keyboard shortcuts</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-subtle hover:bg-surface-2 hover:text-fg"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <ul className="m-0 list-none space-y-2.5 p-0">
              {SHORTCUTS.map(s => (
                <li key={s.desc} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted">{s.desc}</span>
                  <span className="flex gap-1">{s.keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

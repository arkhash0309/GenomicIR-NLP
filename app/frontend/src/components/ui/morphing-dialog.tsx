// Adapted from motion-primitives (https://motion-primitives.com/docs/morphing-dialog), MIT.
// Changes: the morphing container (MorphingDialogTrigger) is a plain element
// and opening is done by a separate MorphingDialogOpen button, so the card can
// keep its own links without nesting interactive elements inside a <button>;
// accessible names come from the caller; themed with tokens.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, MotionConfig, motion, type Transition, type Variant } from 'motion/react'
import { X } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { cn } from '../../lib/utils'

type MorphingDialogContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  uniqueId: string
  openRef: React.RefObject<HTMLButtonElement>
}

const MorphingDialogContext = createContext<MorphingDialogContextType | null>(null)

function useMorphingDialog() {
  const context = useContext(MorphingDialogContext)
  if (!context) throw new Error('useMorphingDialog must be used within a MorphingDialog')
  return context
}

export function MorphingDialog({ children, transition }: { children: ReactNode; transition?: Transition }) {
  const [isOpen, setIsOpen] = useState(false)
  const uniqueId = useId()
  const openRef = useRef<HTMLButtonElement>(null)
  const value = useMemo(() => ({ isOpen, setIsOpen, uniqueId, openRef }), [isOpen, uniqueId])

  return (
    <MorphingDialogContext.Provider value={value}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogContext.Provider>
  )
}

/** The element that morphs into the dialog. */
export function MorphingDialogTrigger({
  children,
  className,
  style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const { uniqueId } = useMorphingDialog()
  return (
    <motion.div layoutId={`dialog-${uniqueId}`} className={className} style={style}>
      {children}
    </motion.div>
  )
}

/** A button inside the trigger that opens the dialog. */
export function MorphingDialogOpen({ children, className, ...props }: ComponentProps<typeof motion.button>) {
  const { setIsOpen, isOpen, uniqueId, openRef } = useMorphingDialog()
  return (
    <motion.button
      {...props}
      ref={openRef}
      type="button"
      onClick={() => setIsOpen(true)}
      className={className}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={`morphing-dialog-content-${uniqueId}`}
    >
      {children}
    </motion.button>
  )
}

export function MorphingDialogContainer({ children }: { children: ReactNode }) {
  const { isOpen, uniqueId } = useMorphingDialog()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence initial={false} mode="sync">
      {isOpen && (
        <>
          <motion.div
            key={`backdrop-${uniqueId}`}
            className="fixed inset-0 z-[60] bg-canvas/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">{children}</div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function MorphingDialogContent({
  children,
  className,
  style,
  'aria-label': ariaLabel,
}: { children: ReactNode; className?: string; style?: CSSProperties; 'aria-label'?: string }) {
  const { setIsOpen, isOpen, uniqueId, openRef } = useMorphingDialog()
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [setIsOpen])

  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    const focusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? [])

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    document.body.classList.add('overflow-hidden')
    focusables()[0]?.focus()
    document.addEventListener('keydown', onKey)
    const opener = openRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overflow-hidden')
      opener?.focus()
    }
  }, [isOpen, close, openRef])

  useClickOutside(containerRef, () => { if (isOpen) close() })

  return (
    <motion.div
      ref={containerRef}
      layoutId={`dialog-${uniqueId}`}
      id={`morphing-dialog-content-${uniqueId}`}
      className={cn('overflow-hidden', className)}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {children}
    </motion.div>
  )
}

export function MorphingDialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  const { uniqueId } = useMorphingDialog()
  return (
    <motion.div layoutId={`dialog-title-${uniqueId}`} layout className={className}>
      {children}
    </motion.div>
  )
}

export function MorphingDialogSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  const { uniqueId } = useMorphingDialog()
  return (
    <motion.div layoutId={`dialog-subtitle-${uniqueId}`} className={className}>
      {children}
    </motion.div>
  )
}

export function MorphingDialogDescription({
  children,
  className,
  variants,
}: {
  children: ReactNode
  className?: string
  variants?: { initial: Variant; animate: Variant; exit: Variant }
}) {
  return (
    <motion.div variants={variants} className={className} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

export function MorphingDialogClose({ className }: { className?: string }) {
  const { setIsOpen } = useMorphingDialog()
  return (
    <motion.button
      type="button"
      onClick={() => setIsOpen(false)}
      aria-label="Close preview"
      className={cn('absolute right-4 top-4 rounded-md p-1 text-subtle hover:bg-surface-2 hover:text-fg', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.1 } }}
      exit={{ opacity: 0 }}
    >
      <X size={18} aria-hidden="true" />
    </motion.button>
  )
}

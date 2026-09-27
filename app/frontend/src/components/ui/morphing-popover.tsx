// Adapted from motion-primitives (https://motion-primitives.com/docs/morphing-popover), MIT.
// Changes: rendered with <span>s so it can sit inline inside a paragraph
// (used for citation markers), themed with tokens, returns focus to the
// trigger on Escape, and drops the unused asChild path.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition, type Variants } from 'motion/react'
import { X } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'
import { cn } from '../../lib/utils'

const TRANSITION: Transition = { type: 'spring', bounce: 0.1, duration: 0.35 }

type MorphingPopoverContextValue = {
  isOpen: boolean
  open: () => void
  close: (returnFocus?: boolean) => void
  uniqueId: string
  triggerRef: React.RefObject<HTMLButtonElement>
  variants?: Variants
}

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(null)

function usePopover(component: string) {
  const ctx = useContext(MorphingPopoverContext)
  if (!ctx) throw new Error(`${component} must be used within MorphingPopover`)
  return ctx
}

export type MorphingPopoverProps = {
  children: ReactNode
  transition?: Transition
  defaultOpen?: boolean
  variants?: Variants
  className?: string
}

export function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen = false,
  variants,
  className,
}: MorphingPopoverProps) {
  const uniqueId = useId()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback((returnFocus = false) => {
    setIsOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  return (
    <MorphingPopoverContext.Provider value={{ isOpen, open, close, uniqueId, triggerRef, variants }}>
      <MotionConfig transition={transition}>
        <span className={cn('relative inline-flex items-center', className)}>{children}</span>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  )
}

export function MorphingPopoverTrigger({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & ComponentProps<typeof motion.button>) {
  const { open, isOpen, uniqueId, triggerRef } = usePopover('MorphingPopoverTrigger')

  return (
    <motion.span layoutId={`popover-trigger-${uniqueId}`} className="inline-flex">
      <motion.button
        {...props}
        ref={triggerRef}
        type="button"
        onClick={open}
        layoutId={`popover-label-${uniqueId}`}
        className={className}
        aria-expanded={isOpen}
        aria-controls={`popover-content-${uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.span>
  )
}

export function MorphingPopoverContent({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & ComponentProps<typeof motion.span>) {
  const { isOpen, close, uniqueId, variants } = usePopover('MorphingPopoverContent')
  const ref = useRef<HTMLSpanElement>(null)
  useClickOutside(ref, () => { if (isOpen) close() })

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.span
          {...props}
          ref={ref}
          layoutId={`popover-trigger-${uniqueId}`}
          id={`popover-content-${uniqueId}`}
          role="dialog"
          className={cn(
            'absolute z-40 block overflow-hidden rounded-lg border border-line bg-surface p-3 text-left text-fg shadow-lg',
            className,
          )}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function MorphingPopoverClose({ className }: { className?: string }) {
  const { close } = usePopover('MorphingPopoverClose')
  return (
    <button
      type="button"
      onClick={() => close(true)}
      aria-label="Close"
      className={cn('absolute right-2 top-2 rounded p-0.5 text-subtle hover:bg-surface-2 hover:text-fg', className)}
    >
      <X size={14} aria-hidden="true" />
    </button>
  )
}

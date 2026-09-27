// Adapted from motion-primitives (https://motion-primitives.com/docs/disclosure), MIT.
// Changes: the trigger no longer lets the child's own props overwrite the
// injected onClick/aria-expanded, and the content gets an id the trigger
// points at via aria-controls.
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, MotionConfig, type Transition, type Variant, type Variants } from 'motion/react'
import { cn } from '../../lib/utils'

type DisclosureContextType = {
  open: boolean
  toggle: () => void
  contentId: string
  variants?: { expanded: Variant; collapsed: Variant }
}

const DisclosureContext = createContext<DisclosureContextType | undefined>(undefined)

function useDisclosure() {
  const context = useContext(DisclosureContext)
  if (!context) throw new Error('useDisclosure must be used within a Disclosure')
  return context
}

export type DisclosureProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
  variants?: { expanded: Variant; collapsed: Variant }
  transition?: Transition
}

export function Disclosure({
  open: openProp = false,
  onOpenChange,
  children,
  className,
  transition,
  variants,
}: DisclosureProps) {
  const [open, setOpen] = useState(openProp)
  const contentId = useId()

  useEffect(() => { setOpen(openProp) }, [openProp])

  const toggle = () => {
    setOpen(!open)
    onOpenChange?.(!open)
  }

  return (
    <MotionConfig transition={transition}>
      <div className={className}>
        <DisclosureContext.Provider value={{ open, toggle, contentId, variants }}>
          {children}
        </DisclosureContext.Provider>
      </div>
    </MotionConfig>
  )
}

export function DisclosureTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { toggle, open, contentId } = useDisclosure()

  return (
    <>
      {Children.map(children, child => {
        if (!isValidElement(child)) return child
        const el = child as ReactElement<Record<string, unknown>>
        return cloneElement(el, {
          ...el.props,
          onClick: toggle,
          'aria-expanded': open,
          'aria-controls': contentId,
          className: cn(className, el.props.className as string | undefined),
        })
      })}
    </>
  )
}

export function DisclosureContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, variants, contentId } = useDisclosure()

  const combinedVariants: Variants = {
    expanded:  { height: 'auto', opacity: 1, ...variants?.expanded },
    collapsed: { height: 0, opacity: 0, ...variants?.collapsed },
  }

  return (
    <div className={cn('overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={combinedVariants}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

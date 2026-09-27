// Icon/label swap adapted from Watermelon UI "copy-confirm" (https://ui.watermelon.sh).
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../lib/utils'

interface Props {
  text: string
  label?: string
  /** Show the "Copy"/"Copied" text next to the icon. */
  showLabel?: boolean
  className?: string
}

export default function CopyButton({ text, label = 'Copy', showLabel = false, className }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable — ignore */ }
  }

  const swap = {
    initial: { opacity: 0, scale: 0.4, filter: 'blur(3px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit:    { opacity: 0, scale: 0.4, filter: 'blur(3px)' },
    transition: { type: 'spring' as const, duration: 0.3, bounce: 0 },
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-xs text-subtle transition-colors hover:text-fg',
        showLabel ? 'px-2 py-1 hover:bg-surface-2' : 'p-1',
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={copied ? 'check' : 'copy'} {...swap} className="flex">
          {copied
            ? <Check size={14} className="text-success" aria-hidden="true" />
            : <Copy size={14} aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
      {showLabel && <span aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
    </button>
  )
}

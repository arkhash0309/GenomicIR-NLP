import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Props {
  children: string
  className?: string
  /** extra delay in seconds before the first word appears */
  delay?: number
  once?: boolean
  /** false = animate on mount regardless of scroll position (for above-the-fold content) */
  scrollTriggered?: boolean
}

export default function SplitText({ children, className = '', delay = 0, once = true, scrollTriggered = true }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once, margin: '0px' })
  const shouldShow = !scrollTriggered || inView

  const words = children.split(' ')

  return (
    <span ref={ref} className={className} aria-label={children}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.26em] last:mr-0" aria-hidden="true">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '105%', opacity: 0 }}
            animate={shouldShow ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// Adapted from motion-primitives (https://motion-primitives.com/docs/animated-number), MIT.
// Changes: renders a plain motion.span (no per-render motion.create) and
// respects prefers-reduced-motion by jumping straight to the value.
import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring, useTransform, type SpringOptions } from 'motion/react'
import { cn } from '../../lib/utils'

export type AnimatedNumberProps = {
  value: number
  className?: string
  springOptions?: SpringOptions
}

export function AnimatedNumber({
  value,
  className,
  springOptions = { bounce: 0, duration: 1200 },
}: AnimatedNumberProps) {
  const reduced = useReducedMotion()
  const spring = useSpring(reduced ? value : 0, springOptions)
  const display = useTransform(spring, current => Math.round(current).toLocaleString())

  useEffect(() => {
    if (reduced) spring.jump(value)
    else spring.set(value)
  }, [spring, value, reduced])

  return <motion.span className={cn('tabular-nums', className)}>{display}</motion.span>
}

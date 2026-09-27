// Adapted from motion-primitives (https://motion-primitives.com/docs/text-shimmer), MIT.
// Changes: colours come from theme tokens; the motion component is memoised per
// `as` so the shimmer doesn't remount on every render.
import { memo, useMemo, type CSSProperties, type ElementType } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

export type TextShimmerProps = {
  children: string
  as?: ElementType
  className?: string
  duration?: number
  spread?: number
}

function TextShimmerComponent({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = useMemo(() => motion.create(Component as 'p'), [Component])
  const dynamicSpread = children.length * spread

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        '[--base-color:rgb(var(--subtle))] [--base-gradient-color:rgb(var(--fg))]',
        '[background-repeat:no-repeat,padding-box]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]',
        className,
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{ repeat: Infinity, duration, ease: 'linear' }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage: 'var(--bg), linear-gradient(var(--base-color), var(--base-color))',
      } as CSSProperties}
    >
      {children}
    </MotionComponent>
  )
}

export const TextShimmer = memo(TextShimmerComponent)

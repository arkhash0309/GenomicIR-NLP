import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  intensity?: number
}

export default function TiltCard({ children, className = '', intensity = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const sx = useSpring(mx, { stiffness: 180, damping: 22 })
  const sy = useSpring(my, { stiffness: 180, damping: 22 })

  const rotX = useTransform(sy, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`])
  const rotY = useTransform(sx, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`])
  const brightness = useTransform(
    [sx, sy] as any,
    ([x, y]: number[]) => 1 + Math.sqrt(x * x + y * y) * 0.08
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const handleMouseLeave = () => { mx.set(0); my.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: rotX, rotateY: rotY, filter: `brightness(${brightness})`, transformStyle: 'preserve-3d' }}
      className={`${className} relative`}
    >
      {children}
    </motion.div>
  )
}

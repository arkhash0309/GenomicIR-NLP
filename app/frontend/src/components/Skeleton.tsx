import { cn } from '../lib/utils'

interface Props {
  className?: string
  rounded?: boolean
}

export default function Skeleton({ className, rounded = false }: Props) {
  return (
    <div
      className={cn('animate-pulse bg-surface-2', rounded ? 'rounded-full' : 'rounded-md', className)}
      aria-hidden="true"
    />
  )
}

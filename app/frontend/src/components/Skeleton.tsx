interface Props {
  className?: string
  rounded?: boolean
}

export default function Skeleton({ className = '', rounded = false }: Props) {
  return (
    <div
      className={`animate-pulse bg-white/10 ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
      aria-hidden="true"
    />
  )
}

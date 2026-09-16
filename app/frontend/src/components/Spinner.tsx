interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = { sm: 16, md: 24, lg: 36 }

export default function Spinner({ size = 'md', label = 'Loading…' }: Props) {
  const px = SIZES[size]
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-genomic-cyan"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

import { LoaderCircle } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = { sm: 16, md: 20, lg: 28 }

export default function Spinner({ size = 'md', label = 'Loading…' }: Props) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <LoaderCircle size={SIZES[size]} className="animate-spin text-subtle" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

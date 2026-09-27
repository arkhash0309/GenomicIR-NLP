import { cn } from '../lib/utils'

export type EntityType = 'Gene' | 'Disease' | 'Chemical'

const DOT: Record<EntityType, string> = {
  Gene:     'bg-entity-gene',
  Disease:  'bg-entity-disease',
  Chemical: 'bg-entity-chemical',
}

interface Props {
  name: string
  type: EntityType
  onClick?: () => void
  selected?: boolean
}

export default function EntityChip({ name, type, onClick, selected }: Props) {
  const className = cn(
    'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium text-fg',
    selected ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface-2',
    onClick && 'transition-colors hover:border-line-strong',
  )
  const content = (
    <>
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[type] ?? DOT.Gene)} aria-hidden="true" />
      {name}
      <span className="sr-only">({type})</span>
    </>
  )

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={selected} className={className}>{content}</button>
  ) : (
    <span className={className}>{content}</span>
  )
}

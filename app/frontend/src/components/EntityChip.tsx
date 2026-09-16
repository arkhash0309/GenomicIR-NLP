// src/components/EntityChip.tsx
const COLORS = {
  Gene:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Disease:  'bg-rose-500/20    text-rose-300    border-rose-500/30',
  Chemical: 'bg-amber-500/20   text-amber-300   border-amber-500/30',
}

interface Props { name: string; type: 'Gene' | 'Disease' | 'Chemical'; onClick?: () => void }

export default function EntityChip({ name, type, onClick }: Props) {
  return (
    <span onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium cursor-pointer ${COLORS[type] ?? COLORS.Gene}`}>
      {name}
    </span>
  )
}

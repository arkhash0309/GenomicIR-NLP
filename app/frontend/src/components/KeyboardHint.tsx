interface Props {
  keys: string[]
  label: string
}

export default function KeyboardHint({ keys, label }: Props) {
  return (
    <span className="hidden sm:inline-flex items-center gap-1 text-white/30 text-xs" aria-label={label}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 glass rounded text-xs font-mono leading-none text-white/40"
          style={{ fontSize: '0.65rem' }}
        >
          {k}
        </kbd>
      ))}
      <span className="ml-0.5">{label}</span>
    </span>
  )
}

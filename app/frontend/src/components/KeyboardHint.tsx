interface Props {
  keys: string[]
  label: string
}

export default function KeyboardHint({ keys, label }: Props) {
  return (
    <span className="hidden items-center gap-1 text-xs text-subtle sm:inline-flex">
      {keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}
      <span className="ml-0.5">{label}</span>
    </span>
  )
}

import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import Spinner from './Spinner'

interface Props {
  onSearch: (q: string) => void
  placeholder?: string
  loading?: boolean
  defaultValue?: string
  inputRef?: React.Ref<HTMLInputElement>
}

export default function SearchBar({ onSearch, placeholder = 'Search papers…', loading, defaultValue = '', inputRef }: Props) {
  const [q, setQ] = useState(defaultValue)
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()) }

  return (
    <form onSubmit={submit} role="search" className="card flex items-center gap-2 p-1.5 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
      <Search size={16} className="ml-2 shrink-0 text-subtle" aria-hidden="true" />
      <label htmlFor="search-input" className="sr-only">Search papers</label>
      <input
        id="search-input"
        ref={inputRef}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-fg placeholder:text-subtle focus:outline-none"
      />
      <button type="submit" disabled={loading || !q.trim()} className="btn-primary min-w-[5.5rem] shrink-0 px-3">
        {loading ? <Spinner size="sm" label="Searching…" /> : 'Search'}
      </button>
    </form>
  )
}

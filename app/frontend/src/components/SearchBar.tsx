// src/components/SearchBar.tsx
import { FormEvent, useState } from 'react'

interface Props { onSearch: (q: string) => void; placeholder?: string; loading?: boolean }

export default function SearchBar({ onSearch, placeholder = 'Search genomics papers…', loading }: Props) {
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()) }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 transition-colors" />
      <button type="submit" disabled={loading}
        className="px-5 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors">
        {loading ? '…' : 'Search'}
      </button>
    </form>
  )
}

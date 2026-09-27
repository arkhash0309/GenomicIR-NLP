import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import Skeleton from '../components/Skeleton'
import KeyboardHint from '../components/KeyboardHint'
import { api, type SearchResult } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const EXAMPLE_SEARCHES = [
  'CRISPR off-target effects',
  'BRCA1 breast cancer',
  'single-cell RNA sequencing',
  'DNA methylation',
  'alternative splicing',
]

function SearchSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card space-y-2.5 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      ))}
    </div>
  )
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { error } = useToast()

  useDocumentTitle(query ? `${query} — Search` : 'Search')
  useKeyboardShortcut({ '/': () => { inputRef.current?.focus(); inputRef.current?.select() } })

  // The URL is the source of truth, so searches are linkable and survive reloads.
  useEffect(() => {
    if (!query) { setResults([]); setSearched(''); return }
    let cancelled = false
    setLoading(true)
    api.search(query, 10)
      .then(data => { if (!cancelled) { setResults(data.results); setSearched(query) } })
      .catch(() => { if (!cancelled) error('Search failed. Is the backend running?') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query, error])

  const scoreRange = useMemo<[number, number] | undefined>(() => {
    if (results.length === 0) return undefined
    const scores = results.map(r => r.score)
    return [Math.min(...scores), Math.max(...scores)]
  }, [results])

  const runSearch = (q: string) => setSearchParams({ q })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-muted">
          Semantic (FAISS) and keyword (BM25) retrieval, fused with reciprocal rank fusion and reranked by a cross-encoder.
        </p>
      </header>

      <SearchBar key={query} defaultValue={query} onSearch={runSearch} loading={loading} inputRef={inputRef} />

      <div className="mb-8 mt-3 flex items-start justify-between gap-4 px-1">
        {!query ? (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Example searches">
            {EXAMPLE_SEARCHES.map(s => (
              <li key={s}>
                <button type="button" onClick={() => runSearch(s)}
                        className="rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : <span />}
        <KeyboardHint keys={['/']} label="to focus" />
      </div>

      <div aria-live="polite" className="sr-only">
        {loading ? 'Searching…' : searched ? `${results.length} results for ${searched}` : ''}
      </div>

      {loading && <SearchSkeleton />}

      {!loading && searched && results.length > 0 && (
        <section aria-label="Search results">
          <p className="mb-3 text-sm text-subtle">
            {results.length} results for <span className="font-medium text-fg">{searched}</span>
          </p>
          <ol className="m-0 list-none space-y-3 p-0">
            {results.map(r => (
              <li key={r.paper.id}>
                <PaperCard result={r} scoreRange={scoreRange} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="py-16 text-center" role="status">
          <SearchX size={24} className="mx-auto mb-3 text-subtle" aria-hidden="true" />
          <p className="text-sm text-fg">No results for “{searched}”</p>
          <p className="mt-1 text-sm text-subtle">Try broader terms or a gene/disease name.</p>
        </div>
      )}
    </div>
  )
}

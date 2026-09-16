import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import Skeleton from '../components/Skeleton'
import KeyboardHint from '../components/KeyboardHint'
import { api, type SearchResult } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const EXAMPLE_SEARCHES = [
  'CRISPR genome editing', 'BRCA1 breast cancer', 'RNA splicing', 'epigenomics methylation',
]

function SearchSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-5 space-y-3">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-1/3" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Search() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)
  const { error } = useToast()

  useDocumentTitle(query ? `"${query}" — Search` : 'Search')

  const focusSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>('[role="search"] input')
    input?.focus()
    input?.select()
  }, [])

  useKeyboardShortcut({ '/': focusSearch })

  const handleSearch = async (q: string) => {
    setQuery(q)
    setLoading(true)
    try {
      const data = await api.search(q, 10)
      setResults(data.results)
      setTimeout(() => resultsRef.current?.focus(), 100)
    } catch {
      error('Search failed — check that the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hybrid Search</h1>
        <p className="text-white/50">FAISS semantic + BM25 lexical + cross-encoder reranking</p>
      </header>

      <div className="space-y-2">
        <SearchBar onSearch={handleSearch} loading={loading} />
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {!query && EXAMPLE_SEARCHES.map(s => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="text-xs glass px-2.5 py-1 rounded-md text-white/40 hover:text-white/70 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <KeyboardHint keys={['/']} label="to focus" />
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading
          ? 'Searching…'
          : results.length > 0
            ? `${results.length} results found for "${query}"`
            : query && !loading
              ? 'No results found'
              : ''}
      </div>

      {loading && <SearchSkeleton />}

      <AnimatePresence>
        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
            <div ref={resultsRef} tabIndex={-1} className="focus:outline-none">
              <p className="text-white/40 text-sm mb-4" role="status">
                {results.length} results for &ldquo;{query}&rdquo;
              </p>
              <ol className="space-y-4 list-none p-0 m-0" aria-label="Search results">
                {results.map((r, i) => (
                  <li key={r.paper.id} aria-label={`Result ${i + 1} of ${results.length}`}>
                    <PaperCard result={r} showScore />
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}

        {!loading && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 text-center"
            role="status"
          >
            <div className="text-4xl mb-4" aria-hidden="true">🔬</div>
            <p className="text-white/40 text-sm">No results found for &ldquo;{query}&rdquo;</p>
            <p className="text-white/20 text-xs mt-2">Try different keywords or check spelling</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

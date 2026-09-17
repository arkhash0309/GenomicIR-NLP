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
  'CRISPR genome editing',
  'BRCA1 breast cancer',
  'RNA splicing',
  'epigenomics methylation',
  'single-cell sequencing',
  'CRISPR off-target',
]

function SearchSkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-3 animate-pulse">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-12 w-3 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/5" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsHeader({ count, query }: { count: number; query: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-genomic-emerald" />
        <p className="text-[var(--text-40)] text-sm" role="status">
          <span className="text-[var(--text-70)] font-semibold">{count}</span>
          {' '}results for{' '}
          <span className="text-genomic-cyan font-mono">&ldquo;{query}&rdquo;</span>
        </p>
      </div>
      <span className="text-[10px] font-mono text-[var(--text-25)] uppercase tracking-wider">
        Hybrid IR
      </span>
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

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-genomic-emerald/10 flex items-center justify-center text-genomic-emerald">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hybrid Search</h1>
        </div>
        <p className="text-[var(--text-40)] text-sm">
          FAISS semantic + BM25 lexical + cross-encoder reranking over 7,000+ bioRxiv papers
        </p>
      </motion.header>

      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3 mb-8"
      >
        <SearchBar onSearch={handleSearch} loading={loading} />

        <div className="flex items-center justify-between px-1">
          <div className="flex flex-wrap gap-2">
            {!query && EXAMPLE_SEARCHES.map(s => (
              <motion.button
                key={s}
                onClick={() => handleSearch(s)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="text-[11px] glass px-3 py-1.5 rounded-xl text-[var(--text-35,rgba(240,244,255,0.35))] hover:text-[var(--text-65,rgba(240,244,255,0.65))] hover:border-genomic-emerald/20 transition-all font-mono"
                style={{ color: 'rgba(240,244,255,0.38)' }}
              >
                {s}
              </motion.button>
            ))}
          </div>
          <KeyboardHint keys={['/']} label="to focus" />
        </div>
      </motion.div>

      {/* Screen reader status */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading
          ? 'Searching…'
          : results.length > 0
            ? `${results.length} results found for "${query}"`
            : query && !loading
              ? 'No results found'
              : ''}
      </div>

      {/* Loading */}
      {loading && <SearchSkeleton />}

      {/* Results */}
      <AnimatePresence>
        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div ref={resultsRef} tabIndex={-1} className="focus:outline-none">
              <ResultsHeader count={results.length} query={query} />
              <ol className="space-y-3 list-none p-0 m-0" aria-label="Search results">
                {results.map((r, i) => (
                  <motion.li
                    key={r.paper.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    aria-label={`Result ${i + 1} of ${results.length}`}
                  >
                    <PaperCard result={r} showScore />
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}

        {!loading && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center"
            role="status"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <p className="text-[var(--text-40)] text-sm mb-1">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-[var(--text-25)] text-xs">Try different keywords or check spelling</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

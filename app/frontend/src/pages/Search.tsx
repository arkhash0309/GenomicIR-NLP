import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import { api, type SearchResult } from '../lib/api'

export default function Search() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (q: string) => {
    setQuery(q)
    setLoading(true)
    try {
      const data = await api.search(q, 10)
      setResults(data.results)
      // Move focus to results after they load
      setTimeout(() => resultsRef.current?.focus(), 100)
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

      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Live region for result count announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading
          ? 'Searching…'
          : results.length > 0
            ? `${results.length} results found for "${query}"`
            : query && !loading
              ? 'No results found'
              : ''}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-4"
          >
            <div
              ref={resultsRef}
              tabIndex={-1}
              className="focus:outline-none"
              aria-label={`Search results: ${results.length} papers for "${query}"`}
            >
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
      </AnimatePresence>
    </div>
  )
}

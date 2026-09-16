// src/pages/Search.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import { api, type SearchResult } from '../lib/api'

export default function Search() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = async (q: string) => {
    setQuery(q); setLoading(true)
    try {
      const data = await api.search(q, 10)
      setResults(data.results)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Hybrid Search</h1>
      <p className="text-white/50 mb-8">FAISS semantic + BM25 lexical + cross-encoder reranking</p>
      <SearchBar onSearch={handleSearch} loading={loading} />

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
            <p className="text-white/40 text-sm">{results.length} results for "{query}"</p>
            {results.map(r => <PaperCard key={r.paper.id} result={r} showScore />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

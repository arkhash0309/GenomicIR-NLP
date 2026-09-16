import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type PaperDetail as PaperDetailType } from '../lib/api'
import EntityChip from '../components/EntityChip'

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>()
  const [paper, setPaper] = useState<PaperDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    api.paper(parseInt(id)).then(setPaper).catch(() => setPaper(null)).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-genomic-cyan" role="status" aria-live="polite">
        <span className="sr-only">Loading paper details…</span>
        <span aria-hidden="true">Loading…</span>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="text-center py-32 text-white/40" role="alert">
        Paper not found.{' '}
        <Link to="/search" className="text-genomic-cyan underline underline-offset-2">
          Back to search
        </Link>
      </div>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-12"
      aria-label={`Paper: ${paper.title}`}
    >
      <button
        onClick={() => navigate(-1)}
        className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
        aria-label="Go back to previous page"
      >
        <span aria-hidden="true">←</span> Back
      </button>

      <article>
        <h1 className="text-3xl font-bold mb-3">{paper.title}</h1>
        <p className="text-white/50 mb-1">{paper.authors}</p>
        <time className="text-white/30 text-sm mb-6 block" dateTime={paper.date}>
          {paper.date}
        </time>

        {/* External links */}
        <div className="flex flex-wrap gap-3 mb-8" role="group" aria-label="Paper links">
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-genomic-cyan/20 text-genomic-cyan rounded-lg text-sm hover:bg-genomic-cyan/30 transition-colors"
              aria-label={`View DOI ${paper.doi} (opens in new tab)`}
            >
              DOI: {paper.doi}
            </a>
          )}
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 glass rounded-lg text-sm hover:border-white/30 transition-colors"
              aria-label="View on bioRxiv (opens in new tab)"
            >
              View on bioRxiv →
            </a>
          )}
          <Link
            to={`/ask?q=${encodeURIComponent(`Tell me about: ${paper.title}`)}`}
            className="px-4 py-2 glass rounded-lg text-sm hover:border-genomic-cyan/40 text-genomic-cyan/80 transition-colors"
            aria-label={`Ask research assistant about this paper: ${paper.title}`}
          >
            Ask about this paper →
          </Link>
        </div>

        {/* Entities */}
        {paper.entities.length > 0 && (
          <section className="glass rounded-2xl p-5 mb-6" aria-label="Extracted biomedical entities">
            <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">
              Extracted entities ({paper.entities.length})
            </h2>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Biomedical entities">
              {paper.entities.map((e, i) => (
                <div key={i} role="listitem">
                  <EntityChip name={e.name} type={e.type as any} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Abstract */}
        <section className="glass rounded-2xl p-6 mb-6" aria-label="Paper abstract">
          <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">Abstract</h2>
          <p className="text-white/90 leading-relaxed">{paper.abstract}</p>
        </section>

        {/* Summary */}
        {paper.summary && (
          <section className="glass rounded-2xl p-6 border-l-2 border-genomic-cyan/40" aria-label="Paper summary">
            <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">Summary</h2>
            <p className="text-white/80 leading-relaxed">{paper.summary}</p>
          </section>
        )}
      </article>
    </motion.main>
  )
}

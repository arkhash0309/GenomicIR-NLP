import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type PaperDetail as PaperDetailType } from '../lib/api'
import EntityChip from '../components/EntityChip'
import Spinner from '../components/Spinner'
import CopyButton from '../components/CopyButton'

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
      <div className="flex flex-col items-center justify-center py-32 gap-4" role="status">
        <Spinner size="lg" label="Loading paper details…" />
        <p className="text-white/40 text-sm">Loading paper…</p>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="text-center py-32 text-white/40" role="alert">
        <p className="text-xl mb-4">Paper not found</p>
        <Link to="/search" className="text-genomic-cyan hover:underline underline-offset-2 text-sm">
          ← Back to search
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <button
        onClick={() => navigate(-1)}
        className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors group"
        aria-label="Go back to previous page"
      >
        <span aria-hidden="true" className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
        Back
      </button>

      <article>
        <h1 className="text-3xl font-bold mb-3 leading-tight">{paper.title}</h1>
        <p className="text-white/50 mb-1">{paper.authors}</p>
        <time className="text-white/30 text-sm mb-6 block" dateTime={paper.date}>
          {paper.date}
        </time>

        <div className="flex flex-wrap gap-3 mb-8" role="group" aria-label="Paper links">
          {paper.doi && (
            <div className="flex items-center gap-2">
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-genomic-cyan/20 text-genomic-cyan rounded-lg text-sm hover:bg-genomic-cyan/30 transition-colors"
                aria-label={`View DOI ${paper.doi} (opens in new tab)`}
              >
                DOI: {paper.doi}
              </a>
              <CopyButton text={`https://doi.org/${paper.doi}`} label="Copy DOI link" className="text-white/30 hover:text-white/60 px-2 py-1" />
            </div>
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
            aria-label={`Ask research assistant about this paper`}
          >
            Ask about this paper →
          </Link>
        </div>

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

        <section className="glass rounded-2xl p-6 mb-6" aria-label="Paper abstract">
          <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">Abstract</h2>
          <p className="text-white/90 leading-relaxed">{paper.abstract}</p>
        </section>

        {paper.summary && (
          <section className="glass rounded-2xl p-6 border-l-2 border-genomic-cyan/40" aria-label="Paper summary">
            <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">Summary</h2>
            <p className="text-white/80 leading-relaxed">{paper.summary}</p>
          </section>
        )}
      </article>
    </motion.div>
  )
}

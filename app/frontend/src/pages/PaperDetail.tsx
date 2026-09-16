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

  if (loading) return <div className="flex justify-center py-32 text-genomic-cyan">Loading…</div>
  if (!paper) return <div className="text-center py-32 text-white/40">Paper not found. <Link to="/search" className="text-genomic-cyan">Back to search</Link></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2">
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-3">{paper.title}</h1>
      <p className="text-white/50 mb-2">{paper.authors}</p>
      <p className="text-white/30 text-sm mb-6">{paper.date}</p>

      <div className="flex gap-3 mb-8">
        {paper.doi && <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
          className="px-4 py-2 bg-genomic-cyan/20 text-genomic-cyan rounded-lg text-sm hover:bg-genomic-cyan/30 transition-colors">
          DOI: {paper.doi}
        </a>}
        {paper.url && <a href={paper.url} target="_blank" rel="noreferrer"
          className="px-4 py-2 glass rounded-lg text-sm hover:border-white/30 transition-colors">
          View on bioRxiv →
        </a>}
        <Link to={`/ask?q=${encodeURIComponent(`Tell me about: ${paper.title}`)}`}
          className="px-4 py-2 glass rounded-lg text-sm hover:border-genomic-cyan/40 text-genomic-cyan/80 transition-colors">
          Ask about this paper →
        </Link>
      </div>

      {paper.entities.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <p className="text-white/40 text-xs mb-3">Extracted entities</p>
          <div className="flex flex-wrap gap-2">
            {paper.entities.map((e, i) => (
              <EntityChip key={i} name={e.name} type={e.type as any} />
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-white/40 text-xs mb-3">Abstract</p>
        <p className="text-white/90 leading-relaxed">{paper.abstract}</p>
      </div>

      {paper.summary && (
        <div className="glass rounded-2xl p-6 border-l-2 border-genomic-cyan/40">
          <p className="text-white/40 text-xs mb-3">Summary</p>
          <p className="text-white/80 leading-relaxed">{paper.summary}</p>
        </div>
      )}
    </motion.div>
  )
}

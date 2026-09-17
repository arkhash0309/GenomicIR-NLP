import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type PaperDetail as PaperDetailType } from '../lib/api'
import EntityChip from '../components/EntityChip'
import Spinner from '../components/Spinner'
import CopyButton from '../components/CopyButton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>()
  const [paper, setPaper] = useState<PaperDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  useDocumentTitle(paper?.title ? paper.title.slice(0, 60) : 'Paper')

  useEffect(() => {
    if (!id) return
    api.paper(parseInt(id)).then(setPaper).catch(() => setPaper(null)).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4" role="status">
        <Spinner size="lg" label="Loading paper details…" />
        <p className="text-[var(--text-35,rgba(240,244,255,0.35))] text-sm font-mono">Loading paper…</p>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="text-center py-40 text-[var(--text-40)]" role="alert">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-lg font-semibold mb-3">Paper not found</p>
        <Link to="/search" className="text-genomic-cyan hover:underline underline-offset-2 text-sm">
          ← Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => navigate(-1)}
        className="text-[var(--text-35,rgba(240,244,255,0.35))] hover:text-[var(--text-70)] text-sm mb-8 flex items-center gap-2 transition-colors group"
        aria-label="Go back to previous page"
      >
        <span aria-hidden="true" className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
        Back
      </motion.button>

      <motion.article
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="font-display text-[clamp(24px,4vw,40px)] leading-tight tracking-[-0.015em] mb-4"
        >
          {paper.title}
        </motion.h1>

        {/* Meta */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-7">
          <span className="text-[var(--text-45,rgba(240,244,255,0.45))] text-sm">{paper.authors}</span>
          {paper.date && (
            <>
              <span className="text-white/15" aria-hidden="true">·</span>
              <time dateTime={paper.date} className="text-[var(--text-30)] text-xs font-mono">
                {paper.date}
              </time>
            </>
          )}
        </motion.div>

        {/* Action links */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 mb-10" role="group" aria-label="Paper links">
          {paper.doi && (
            <div className="flex items-center gap-2">
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-genomic-cyan border border-genomic-cyan/20 hover:bg-genomic-cyan/8 transition-all"
                style={{ background: 'rgba(6,182,212,0.06)' }}
                aria-label={`View DOI ${paper.doi} (opens in new tab)`}
              >
                DOI: {paper.doi}
                <ExternalLinkIcon />
              </a>
              <CopyButton
                text={`https://doi.org/${paper.doi}`}
                label="Copy DOI link"
                className="text-white/25 hover:text-white/55 px-2 py-1 glass rounded-lg text-xs transition-colors"
              />
            </div>
          )}
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 glass rounded-xl text-sm hover:border-white/25 transition-colors"
              aria-label="View on bioRxiv (opens in new tab)"
            >
              View on bioRxiv <ExternalLinkIcon />
            </a>
          )}
          <Link
            to={`/ask?q=${encodeURIComponent(`Tell me about: ${paper.title}`)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 glass rounded-xl text-sm hover:border-genomic-cyan/30 text-genomic-cyan/75 transition-colors"
            aria-label="Ask research assistant about this paper"
          >
            Ask about this paper →
          </Link>
        </motion.div>

        {/* Entities */}
        {paper.entities.length > 0 && (
          <motion.section
            variants={fadeUp}
            className="rounded-2xl p-5 mb-5"
            style={{
              background: 'rgba(4,8,15,0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            aria-label="Extracted biomedical entities"
          >
            <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-30)] mb-4">
              Extracted entities ({paper.entities.length})
            </h2>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Biomedical entities">
              {paper.entities.map((e, i) => (
                <div key={i} role="listitem">
                  <EntityChip name={e.name} type={e.type as any} />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Abstract */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'rgba(4,8,15,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          aria-label="Paper abstract"
        >
          <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-30)] mb-4">
            Abstract
          </h2>
          <p className="text-[var(--text-80,rgba(240,244,255,0.8))] leading-relaxed text-[15px]"
             style={{ color: 'rgba(240,244,255,0.82)' }}>
            {paper.abstract}
          </p>
        </motion.section>

        {/* Summary */}
        {paper.summary && (
          <motion.section
            variants={fadeUp}
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'rgba(4,8,15,0.5)',
              border: '1px solid rgba(6,182,212,0.15)',
              borderLeft: '3px solid rgba(6,182,212,0.5)',
            }}
            aria-label="Paper summary"
          >
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
                 style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(6,182,212,0.05) 0%, transparent 60%)' }}
                 aria-hidden="true" />
            <h2 className="relative text-[10px] font-mono tracking-[0.2em] uppercase text-genomic-cyan/60 mb-4">
              AI Summary
            </h2>
            <p className="relative text-[var(--text-75,rgba(240,244,255,0.75))] leading-relaxed text-[15px]"
               style={{ color: 'rgba(240,244,255,0.78)' }}>
              {paper.summary}
            </p>
          </motion.section>
        )}
      </motion.article>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CopyButton from './CopyButton'
import type { SearchResult } from '../lib/api'

interface Props { result: SearchResult; showScore?: boolean }

function ScoreBadge({ score }: { score: number }) {
  const pct   = Math.min(100, Math.round(score * 100))
  const color =
    pct >= 70 ? '#10b981' :
    pct >= 45 ? '#06b6d4' :
    '#f59e0b'
  const label = pct >= 70 ? 'High' : pct >= 45 ? 'Mid' : 'Low'

  return (
    <div
      className="shrink-0 flex flex-col items-end gap-1.5"
      aria-label={`Relevance: ${label} (${score.toFixed(3)})`}
      title={`Relevance score: ${score.toFixed(3)}`}
    >
      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
        {score.toFixed(3)}
      </span>
      <div className="relative w-1 h-12 rounded-full overflow-hidden bg-white/[0.06]">
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: color }}
          aria-hidden="true"
        />
      </div>
      <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: `${color}aa` }}>
        {label}
      </span>
    </div>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

export default function PaperCard({ result, showScore }: Props) {
  const { paper, score } = result
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="group glass rounded-2xl p-5 hover:border-genomic-cyan/25 transition-all duration-300 relative overflow-hidden"
      style={{ '--hover-glow': 'rgba(6,182,212,0.04)' } as React.CSSProperties}
    >
      {/* Hover background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(6,182,212,0.05) 0%, transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link
            to={`/paper/${paper.id}`}
            className="block text-[var(--text-90)] font-semibold hover:text-genomic-cyan transition-colors line-clamp-2 leading-snug mb-2 text-[15px]"
            aria-label={`View paper: ${paper.title}`}
          >
            {paper.title}
          </Link>

          {/* Authors + date */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[var(--text-40)] text-xs truncate max-w-[280px]">
              {paper.authors}
            </span>
            {paper.date && (
              <>
                <span className="text-white/15" aria-hidden="true">·</span>
                <time dateTime={paper.date} className="text-[var(--text-30)] text-xs font-mono shrink-0">
                  {paper.date}
                </time>
              </>
            )}
          </div>

          {/* Abstract */}
          <p className="text-[var(--text-50)] text-sm leading-relaxed line-clamp-2 mb-4">
            {paper.abstract}
          </p>

          {/* Footer links */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/[0.05]">
            {paper.doi && (
              <div className="flex items-center gap-1.5 min-w-0">
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-genomic-cyan/70 hover:text-genomic-cyan transition-colors font-mono truncate max-w-[180px] flex items-center gap-1"
                  aria-label={`Open DOI ${paper.doi} (opens in new tab)`}
                >
                  <span className="truncate">{paper.doi}</span>
                  <ExternalLinkIcon />
                </a>
                <CopyButton text={paper.doi} label="Copy DOI" className="text-white/25 hover:text-white/55 transition-colors shrink-0" />
              </div>
            )}
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-[11px] text-white/25 hover:text-white/55 transition-colors flex items-center gap-1 shrink-0"
                aria-label="View full paper on bioRxiv (opens in new tab)"
              >
                bioRxiv <ExternalLinkIcon />
              </a>
            )}
          </div>
        </div>

        {/* Score badge */}
        {showScore && <ScoreBadge score={score} />}
      </div>
    </motion.article>
  )
}

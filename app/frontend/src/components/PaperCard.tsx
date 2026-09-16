import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CopyButton from './CopyButton'
import type { SearchResult } from '../lib/api'

interface Props { result: SearchResult; showScore?: boolean }

export default function PaperCard({ result, showScore }: Props) {
  const { paper, score } = result
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="glass rounded-xl p-5 hover:border-genomic-cyan/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link
          to={`/paper/${paper.id}`}
          className="text-white font-semibold hover:text-genomic-cyan transition-colors line-clamp-2 leading-snug"
          aria-label={`View paper: ${paper.title}`}
        >
          {paper.title}
        </Link>
        {showScore && (
          <span
            className="shrink-0 text-xs text-genomic-cyan font-mono bg-genomic-cyan/10 px-2 py-1 rounded-md border border-genomic-cyan/20"
            aria-label={`Relevance score: ${score.toFixed(3)}`}
            title={`Relevance score: ${score.toFixed(3)}`}
          >
            {score.toFixed(3)}
          </span>
        )}
      </div>

      <p className="text-white/50 text-xs mb-3">
        {paper.authors}
        {paper.date && (
          <>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <time dateTime={paper.date}>{paper.date}</time>
          </>
        )}
      </p>

      <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-3">{paper.abstract}</p>

      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        {paper.doi && (
          <div className="flex items-center gap-1.5">
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan transition-colors font-mono"
              aria-label={`Open DOI ${paper.doi} (opens in new tab)`}
            >
              {paper.doi}
            </a>
            <CopyButton text={paper.doi} label="Copy DOI" className="text-white/30 hover:text-white/60" />
          </div>
        )}
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/30 hover:text-white/60 transition-colors ml-auto"
            aria-label="View full paper on bioRxiv (opens in new tab)"
          >
            bioRxiv →
          </a>
        )}
      </div>
    </motion.article>
  )
}

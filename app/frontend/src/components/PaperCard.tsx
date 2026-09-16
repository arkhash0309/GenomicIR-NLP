import { Link } from 'react-router-dom'
import type { SearchResult } from '../lib/api'

interface Props { result: SearchResult; showScore?: boolean }

export default function PaperCard({ result, showScore }: Props) {
  const { paper, score } = result
  return (
    <article className="glass rounded-xl p-5 hover:border-genomic-cyan/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={`/paper/${paper.id}`}
          className="text-white font-medium hover:text-genomic-cyan transition-colors line-clamp-2"
          aria-label={`View paper: ${paper.title}`}
        >
          {paper.title}
        </Link>
        {showScore && (
          <span
            className="shrink-0 text-xs text-genomic-cyan font-mono bg-genomic-cyan/10 px-2 py-1 rounded"
            aria-label={`Relevance score: ${score.toFixed(3)}`}
            title={`Relevance score: ${score.toFixed(3)}`}
          >
            {score.toFixed(3)}
          </span>
        )}
      </div>
      <p className="text-white/50 text-sm mt-1">
        <span>{paper.authors}</span>
        <span aria-hidden="true"> · </span>
        <time dateTime={paper.date}>{paper.date}</time>
      </p>
      <p className="text-white/70 text-sm mt-2 line-clamp-3">{paper.abstract}</p>
      <div className="flex gap-3 mt-3">
        {paper.doi && (
          <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
             className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan"
             aria-label={`Open DOI ${paper.doi} (opens in new tab)`}>
            DOI →
          </a>
        )}
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noreferrer"
             className="text-xs text-white/40 hover:text-white/70"
             aria-label="View full paper on bioRxiv (opens in new tab)">
            bioRxiv →
          </a>
        )}
      </div>
    </article>
  )
}

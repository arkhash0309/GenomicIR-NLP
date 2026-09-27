import { Link } from 'react-router-dom'
import { ArrowUpRight, MessageSquareText } from 'lucide-react'
import CopyButton from './CopyButton'
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogOpen,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from './ui/morphing-dialog'
import type { Paper, SearchResult } from '../lib/api'
import { bareDoi, doiUrl } from '../lib/doi'

interface Props {
  result: SearchResult
  /** [min, max] score across the result set; enables the relevance bar. */
  scoreRange?: [number, number]
}

const isKnown = (v: string) => v && v !== 'N/A' && v !== 'nan'

function Meta({ paper }: { paper: Paper }) {
  const parts = [isKnown(paper.authors) && paper.authors, isKnown(paper.date) && paper.date].filter(Boolean)
  if (parts.length === 0) return null
  return <p className="truncate text-xs text-subtle">{parts.join(' · ')}</p>
}

function Links({ paper }: { paper: Paper }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {isKnown(paper.doi) && (
        <span className="inline-flex min-w-0 items-center gap-1">
          <a
            href={doiUrl(paper.doi)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-0.5 font-mono text-subtle hover:text-fg"
          >
            <span className="truncate">{bareDoi(paper.doi)}</span>
            <ArrowUpRight size={12} className="shrink-0" aria-hidden="true" />
            <span className="sr-only">(opens in new tab)</span>
          </a>
          <CopyButton text={bareDoi(paper.doi)} label="Copy DOI" />
        </span>
      )}
      {isKnown(paper.url) && (
        <a href={paper.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-subtle hover:text-fg">
          bioRxiv <ArrowUpRight size={12} aria-hidden="true" />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      )}
    </div>
  )
}

/**
 * Cross-encoder scores are unbounded logits, so the bar shows relevance
 * relative to the other results rather than pretending to be a percentage.
 */
function Score({ score, range: [min, max] }: { score: number; range: [number, number] }) {
  const pct = max > min ? 15 + 85 * ((score - min) / (max - min)) : 100
  return (
    <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5" title="Cross-encoder relevance score (higher is better)">
      <span className="font-mono text-xs tabular-nums text-muted">{score.toFixed(2)}</span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="sr-only">Relevance score {score.toFixed(3)}</span>
    </div>
  )
}

export default function PaperCard({ result, scoreRange }: Props) {
  const { paper, score } = result

  return (
    <MorphingDialog transition={{ type: 'spring', bounce: 0.05, duration: 0.3 }}>
      <MorphingDialogTrigger className="card p-4 transition-colors hover:border-line-strong">
        <article className="flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <MorphingDialogTitle>
              <MorphingDialogOpen className="text-left text-[15px] font-medium leading-snug text-fg hover:text-accent">
                {paper.title}
              </MorphingDialogOpen>
            </MorphingDialogTitle>
            <MorphingDialogSubtitle>
              <Meta paper={paper} />
            </MorphingDialogSubtitle>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">{paper.abstract}</p>
            <div className="pt-1"><Links paper={paper} /></div>
          </div>
          {scoreRange && <Score score={score} range={scoreRange} />}
        </article>
      </MorphingDialogTrigger>

      <MorphingDialogContainer>
        <MorphingDialogContent
          aria-label={paper.title}
          className="card relative flex max-h-[85vh] w-full max-w-2xl flex-col shadow-2xl"
        >
          <div className="overflow-y-auto p-6 pr-12">
            <MorphingDialogTitle>
              <h2 className="text-lg font-semibold leading-snug">{paper.title}</h2>
            </MorphingDialogTitle>
            <MorphingDialogSubtitle>
              <div className="mt-1"><Meta paper={paper} /></div>
            </MorphingDialogSubtitle>
            <MorphingDialogDescription
              variants={{
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0, transition: { delay: 0.08 } },
                exit:    { opacity: 0, y: 8 },
              }}
            >
              <div className="mt-4 space-y-4">
                <section>
                  <h3 className="eyebrow mb-1.5">Abstract</h3>
                  <p className="text-sm leading-relaxed text-fg">{paper.abstract}</p>
                </section>
                {paper.summary && (
                  <section>
                    <h3 className="eyebrow mb-1.5">Model summary (T5)</h3>
                    <p className="text-sm leading-relaxed text-muted">{paper.summary}</p>
                  </section>
                )}
                <Links paper={paper} />
                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link to={`/paper/${paper.id}`} className="btn-primary">Open paper</Link>
                  <Link to={`/ask?q=${encodeURIComponent(`Summarise the findings of "${paper.title}"`)}`} className="btn-secondary">
                    <MessageSquareText size={14} aria-hidden="true" /> Ask about it
                  </Link>
                </div>
              </div>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

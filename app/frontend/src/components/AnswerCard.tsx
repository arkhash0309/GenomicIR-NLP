import { useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, TriangleAlert } from 'lucide-react'
import CopyButton from './CopyButton'
import MarkdownContent from './MarkdownContent'
import { CitationMarker, UnverifiedMarker } from './CitationMarker'
import { segmentAnswer, type Citation } from '../lib/citations'
import { bareDoi, doiUrl } from '../lib/doi'

interface Props {
  answer: string
  citations: Citation[]
  unverified: string[]
  streaming: boolean
}

export default function AnswerCard({ answer, citations, unverified, streaming }: Props) {
  const renderText = useCallback((text: string, key: string): ReactNode => {
    const segments = segmentAnswer(text, citations, unverified)
    if (segments.length === 1 && segments[0].kind === 'text') return text
    return (
      <span key={key}>
        {segments.map((s, i) =>
          s.kind === 'text' ? s.text
          : s.kind === 'cite' ? <CitationMarker key={i} n={s.n} citation={s.citation} />
          : <UnverifiedMarker key={i} doi={s.doi} />,
        )}
      </span>
    )
  }, [citations, unverified])

  if (!answer) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card"
      aria-labelledby="answer-heading"
    >
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id="answer-heading" className="text-sm font-semibold">Answer</h2>
        {!streaming && <CopyButton text={answer} label="Copy answer" showLabel />}
      </header>

      <div className="px-5 py-4" aria-live="polite" aria-busy={streaming}>
        <MarkdownContent content={answer} renderText={renderText} />
        {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent/70 align-middle" aria-hidden="true" />}
      </div>

      {(citations.length > 0 || unverified.length > 0) && (
        <footer className="border-t border-line px-5 py-4">
          {citations.length > 0 && (
            <>
              <h3 className="eyebrow mb-2">Sources</h3>
              <ol className="m-0 list-none space-y-2 p-0">
                {citations.map((c, i) => (
                  <li key={c.doi} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-accent/15 px-1 font-mono text-[0.7rem] text-accent">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <Link to={`/paper/${c.paper_id}`} className="font-medium text-fg hover:text-accent">
                        {c.title || bareDoi(c.doi)}
                      </Link>
                      <a
                        href={doiUrl(c.doi)}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-0.5 font-mono text-xs text-subtle hover:text-fg"
                      >
                        {bareDoi(c.doi)}
                        <ArrowUpRight size={12} aria-hidden="true" />
                        <span className="sr-only">(opens in new tab)</span>
                      </a>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
          {unverified.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-fg" role="note">
              <TriangleAlert size={14} className="mt-px shrink-0 text-warn" aria-hidden="true" />
              <span>
                {unverified.length} cited DOI{unverified.length > 1 ? 's were' : ' was'} not among the retrieved
                papers and could not be verified: <span className="font-mono">{unverified.join(', ')}</span>
              </span>
            </p>
          )}
        </footer>
      )}
    </motion.section>
  )
}

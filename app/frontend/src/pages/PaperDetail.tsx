import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, FileText, MessageSquareText } from 'lucide-react'
import { api, type PaperDetail as PaperDetailType } from '../lib/api'
import EntityChip, { type EntityType } from '../components/EntityChip'
import Skeleton from '../components/Skeleton'
import CopyButton from '../components/CopyButton'
import { bareDoi, doiUrl } from '../lib/doi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const isKnown = (v: string) => v && v !== 'N/A' && v !== 'nan'

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>()
  const [paper, setPaper] = useState<PaperDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  useDocumentTitle(paper?.title ? paper.title.slice(0, 60) : 'Paper')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.paper(parseInt(id)).then(setPaper).catch(() => setPaper(null)).finally(() => setLoading(false))
  }, [id])

  const back = (
    <button type="button" onClick={() => navigate(-1)} className="btn-ghost -ml-2 mb-6 px-2">
      <ArrowLeft size={14} aria-hidden="true" /> Back
    </button>
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" role="status" aria-label="Loading paper">
        {back}
        <Skeleton className="mb-3 h-7 w-4/5" />
        <Skeleton className="mb-8 h-4 w-1/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center" role="alert">
        <FileText size={24} className="mx-auto mb-3 text-subtle" aria-hidden="true" />
        <p className="mb-4 font-medium">Paper not found</p>
        <Link to="/search" className="btn-secondary">Back to search</Link>
      </div>
    )
  }

  const meta = [isKnown(paper.authors) && paper.authors, isKnown(paper.date) && paper.date].filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {back}
      <article>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">{paper.title}</h1>
        {meta.length > 0 && <p className="mt-2 text-sm text-muted">{meta.join(' · ')}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to={`/ask?q=${encodeURIComponent(`Summarise the findings of "${paper.title}"`)}`} className="btn-primary">
            <MessageSquareText size={14} aria-hidden="true" /> Ask about this paper
          </Link>
          {isKnown(paper.url) && (
            <a href={paper.url} target="_blank" rel="noreferrer" className="btn-secondary">
              bioRxiv <ArrowUpRight size={14} aria-hidden="true" />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          )}
          {isKnown(paper.doi) && (
            <span className="inline-flex items-center gap-1 pl-1">
              <a href={doiUrl(paper.doi)} target="_blank" rel="noreferrer" className="font-mono text-xs text-subtle hover:text-fg">
                {bareDoi(paper.doi)}
                <span className="sr-only">(opens in new tab)</span>
              </a>
              <CopyButton text={doiUrl(paper.doi)} label="Copy DOI link" />
            </span>
          )}
        </div>

        <section className="mt-10" aria-labelledby="abstract-heading">
          <h2 id="abstract-heading" className="eyebrow mb-2">Abstract</h2>
          <p className="text-[15px] leading-7 text-fg">{paper.abstract}</p>
        </section>

        {paper.summary && (
          <section className="mt-8" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="eyebrow mb-2">Model summary (fine-tuned T5-small)</h2>
            <p className="border-l-2 border-line-strong pl-4 text-[15px] leading-7 text-muted">{paper.summary}</p>
          </section>
        )}

        {paper.entities.length > 0 && (
          <section className="mt-8" aria-labelledby="entities-heading">
            <h2 id="entities-heading" className="eyebrow mb-2">Extracted entities ({paper.entities.length})</h2>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {paper.entities.map((e, i) => (
                <li key={`${e.type}-${e.name}-${i}`}>
                  <EntityChip name={e.name} type={e.type as EntityType} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}

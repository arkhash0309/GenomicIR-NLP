import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CornerDownLeft, MessageSquareText, Network, Search } from 'lucide-react'
import { api, type Stats } from '../lib/api'
import { EXAMPLE_QUESTIONS } from '../lib/examples'
import { AnimatedNumber } from '../components/ui/animated-number'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const STATS: { key: keyof Stats; label: string }[] = [
  { key: 'paper_count',        label: 'Papers indexed' },
  { key: 'entity_count',       label: 'Distinct entities' },
  { key: 'edge_count',         label: 'Graph edges' },
  { key: 'avg_abstract_words', label: 'Avg. words per abstract' },
]

const PIPELINE: { title: string; body: ReactNode }[] = [
  {
    title: 'Retrieve',
    body: (
      <>
        <code>all-MiniLM-L6-v2</code> embeddings in FAISS and a BM25 index are queried in parallel, merged with
        reciprocal rank fusion (k = 60), and the top 20 are reranked by a <code>ms-marco-MiniLM-L-6-v2</code> cross-encoder.
      </>
    ),
  },
  {
    title: 'Extract',
    body: (
      <>
        scispaCy models (<code>bc5cdr</code> + <code>jnlpba</code>) tag genes, diseases and chemicals in the question and
        in every abstract; the corpus is tagged once and cached.
      </>
    ),
  },
  {
    title: 'Traverse',
    body: (
      <>
        Entities that appear in the same abstract are linked in a NetworkX graph. The agent can ask for an
        entity’s neighbours or for the papers that mention it.
      </>
    ),
  },
  {
    title: 'Answer',
    body: (
      <>
        A tool-use loop (max 8 steps) streams over SSE. Every DOI in the answer is checked against the papers the
        agent retrieved; anything it can’t match is flagged as unverified.
      </>
    ),
  },
]

const TOOLS = [
  {
    to: '/ask',
    icon: MessageSquareText,
    title: 'Research assistant',
    body: 'Ask a question and watch the agent search, follow the graph and cite its sources.',
  },
  {
    to: '/search',
    icon: Search,
    title: 'Search',
    body: 'Hybrid semantic + keyword search with cross-encoder reranking. Preview any result in place.',
  },
  {
    to: '/explore',
    icon: Network,
    title: 'Graph explorer',
    body: 'Enter a few entities and see what they co-occur with across the corpus.',
  },
]

function StatsRow() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.stats().then(setStats).catch(() => setFailed(true))
  }, [])

  return (
    <section aria-label="Corpus statistics">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {STATS.map(({ key, label }) => (
          <div key={key} className="bg-surface px-5 py-4">
            <dt className="text-xs text-subtle">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight">
              {stats ? <AnimatedNumber value={stats[key]} /> : <span className="text-subtle">—</span>}
            </dd>
          </div>
        ))}
      </dl>
      {failed && (
        <p className="mt-2 text-xs text-subtle">
          Live numbers come from the backend’s <code className="font-mono">/stats</code> endpoint, which isn’t reachable right now.
        </p>
      )}
    </section>
  )
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const navigate = useNavigate()
  useDocumentTitle()

  const ask = (q: string) => navigate(`/ask?q=${encodeURIComponent(q.trim())}`)
  const submit = (e: FormEvent) => { e.preventDefault(); if (question.trim()) ask(question) }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="max-w-3xl pb-14 pt-16 sm:pt-24" aria-labelledby="hero-heading">
        <p className="mb-4 text-sm text-muted">Agentic GraphRAG · bioRxiv genomics preprints</p>
        <h1 id="hero-heading" className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Ask the genomics literature a question.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          An LLM agent searches 7,000+ preprints, follows a graph of genes, diseases and chemicals, and answers with
          citations it checks against the papers it actually retrieved. You can inspect every step.
        </p>

        <form onSubmit={submit} className="mt-8">
          <div className="card flex items-center gap-2 p-1.5 shadow-sm focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
            <label htmlFor="home-ask" className="sr-only">Question</label>
            <input
              id="home-ask"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Which genes are associated with colorectal cancer?"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[15px] text-fg placeholder:text-subtle focus:outline-none"
            />
            <button type="submit" disabled={!question.trim()} className="btn-primary shrink-0 px-3">
              Ask <CornerDownLeft size={14} aria-hidden="true" />
            </button>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span className="text-subtle">Try:</span>
          {EXAMPLE_QUESTIONS.map(q => (
            <button key={q} type="button" onClick={() => ask(q)} className="text-muted underline decoration-line-strong underline-offset-4 hover:text-fg">
              {q}
            </button>
          ))}
        </div>
      </section>

      <StatsRow />

      <section className="py-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-xl font-semibold tracking-tight">How an answer is produced</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Each stage is a tool the agent can call; the Ask page shows every call, its arguments and its result.
        </p>
        <ol className="m-0 mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <li key={step.title} className="card p-5">
              <p className="font-mono text-xs text-subtle">0{i + 1}</p>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.8em] [&_code]:text-fg">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line py-16" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="sr-only">Tools</h2>
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {TOOLS.map(({ to, icon: Icon, title, body }) => (
            <li key={to}>
              <Link to={to} className="card group flex h-full flex-col p-5 transition-colors hover:border-line-strong">
                <Icon size={18} className="text-accent" aria-hidden="true" />
                <h3 className="mt-3 flex items-center gap-1.5 font-semibold">
                  {title}
                  <ArrowRight size={14} className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden="true" />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

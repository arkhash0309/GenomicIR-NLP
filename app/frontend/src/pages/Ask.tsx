import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CornerDownLeft, Square, X } from 'lucide-react'
import { useSSE, type SSEEvent } from '../hooks/useSSE'
import { useGraph } from '../hooks/useGraph'
import KnowledgeGraph from '../components/KnowledgeGraph'
import ReasoningTrace from '../components/ReasoningTrace'
import AnswerCard from '../components/AnswerCard'
import KeyboardHint from '../components/KeyboardHint'
import { TextShimmer } from '../components/ui/text-shimmer'
import { AnimatedNumber } from '../components/ui/animated-number'
import { API_BASE, type GraphEdge, type GraphNode } from '../lib/api'
import { applyTraceEvent, pendingTool, toolRunningLabel, type TraceEvent, type TraceStep } from '../lib/trace'
import type { Citation } from '../lib/citations'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { EXAMPLE_QUESTIONS } from '../lib/examples'

const LEGEND: [string, string][] = [
  ['Paper',    'bg-entity-paper'],
  ['Gene',     'bg-entity-gene'],
  ['Disease',  'bg-entity-disease'],
  ['Chemical', 'bg-entity-chemical'],
]

export default function Ask() {
  const [searchParams] = useSearchParams()
  const [question, setQuestion] = useState(() => searchParams.get('q') ?? '')
  const [asked, setAsked] = useState('')
  const [active, setActive] = useState(false)
  const [steps, setSteps] = useState<TraceStep[]>([])
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<Citation[]>([])
  const [unverified, setUnverified] = useState<string[]>([])
  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const { nodes, edges, addNodes, addEdges, reset } = useGraph()
  const { stream, cancel } = useSSE()
  const { error: toastError } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const stepSeq = useRef(0)

  useDocumentTitle('Research assistant')
  useKeyboardShortcut({ '/': () => { inputRef.current?.focus(); inputRef.current?.select() } })
  useEffect(() => cancel, [cancel])

  const handleEvent = useCallback((e: SSEEvent) => {
    if (e.type === 'reasoning' || e.type === 'tool_call' || e.type === 'tool_result') {
      setSteps(prev => applyTraceEvent(prev, e as unknown as TraceEvent, () => `step-${stepSeq.current++}`))
    }
    if (e.type === 'reasoning') {
      setAnswer(prev => prev + (e.text as string))
    } else if (e.type === 'tool_call') {
      // Text before a tool call was intermediate reasoning, not the answer.
      setAnswer('')
    } else if (e.type === 'graph_update') {
      addNodes(e.nodes as GraphNode[])
      addEdges(e.edges as GraphEdge[])
    } else if (e.type === 'done') {
      setCitations((e.citations as Citation[]) ?? [])
      setUnverified((e.unverified as string[]) ?? [])
    }
  }, [addNodes, addEdges])

  const ask = useCallback(async (q: string) => {
    q = q.trim()
    if (!q) return
    cancel()
    reset()
    setSteps([])
    setAnswer('')
    setCitations([])
    setUnverified([])
    setSelectedNode(null)
    setAsked(q)
    setActive(true)
    stepSeq.current = 0

    let finalText = ''
    try {
      await stream(`${API_BASE}/ask`, { question: q, history }, e => {
        if (e.type === 'reasoning') finalText += e.text as string
        else if (e.type === 'tool_call') finalText = ''
        handleEvent(e)
      })
      if (finalText) {
        setHistory(h => [...h, { role: 'user', content: q }, { role: 'assistant', content: finalText }])
      }
    } catch {
      toastError('Could not reach the research assistant. Is the backend running?')
    } finally {
      setActive(false)
    }
  }, [cancel, reset, stream, history, handleEvent, toastError])

  // Auto-run when arriving with ?q= (from the home page or a paper page). The
  // timeout makes this safe under StrictMode's double-invoked effects.
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q) return
    setQuestion(q)
    const t = setTimeout(() => ask(q), 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (active) cancel()
    else ask(question)
  }

  const running = pendingTool(steps)
  const status = !active ? null : running ? toolRunningLabel(running) : answer ? 'Writing answer…' : 'Thinking…'
  const hasSession = active || steps.length > 0 || answer !== ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Research assistant</h1>
        <p className="mt-1 text-sm text-muted">
          An LLM agent that searches the corpus, walks the entity graph, and cites the papers it used.
        </p>
      </header>

      <form onSubmit={submit} className="mb-3">
        <div className="card flex items-center gap-2 p-1.5 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
          <label htmlFor="ask-input" className="sr-only">Question</label>
          <input
            id="ask-input"
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask about genes, diseases, methods…"
            disabled={active}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[15px] text-fg placeholder:text-subtle focus:outline-none disabled:opacity-60"
          />
          {active ? (
            <button type="submit" className="btn-secondary shrink-0 px-3">
              <Square size={12} className="fill-current" aria-hidden="true" /> Stop
            </button>
          ) : (
            <button type="submit" disabled={!question.trim()} className="btn-primary shrink-0 px-3">
              Ask <CornerDownLeft size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <div className="mb-8 flex min-h-6 items-center justify-between gap-4 px-1">
        <div aria-live="polite">
          {status && <TextShimmer as="span" className="text-sm" duration={1.6}>{status}</TextShimmer>}
          {!status && asked && hasSession && (
            <span className="text-sm text-subtle">
              Answered: <span className="text-muted">{asked}</span>
            </span>
          )}
        </div>
        <KeyboardHint keys={['/']} label="to focus" />
      </div>

      {!hasSession && (
        <section aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="eyebrow mb-3">Try one of these</h2>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
            {EXAMPLE_QUESTIONS.map(q => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => { setQuestion(q); ask(q) }}
                  className="card group flex h-full w-full items-start justify-between gap-3 p-3.5 text-left text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  {q}
                  <ArrowRight size={14} className="mt-0.5 shrink-0 text-subtle group-hover:text-fg" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSession && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-4">
            <div className="h-72">
              <ReasoningTrace steps={steps} active={active} />
            </div>
            <AnswerCard answer={answer} citations={citations} unverified={unverified} streaming={active} />
          </div>

          <section
            className="card relative h-[420px] overflow-hidden lg:sticky lg:top-20 lg:h-[520px]"
            aria-labelledby="graph-heading"
          >
            <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-sm">
              <h2 id="graph-heading" className="text-sm font-semibold">Knowledge graph</h2>
              <span className="text-xs text-subtle">
                <AnimatedNumber value={nodes.length} /> nodes · <AnimatedNumber value={edges.length} /> edges
              </span>
            </header>

            {nodes.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center px-8 pt-10 text-center text-sm text-subtle">
                {active ? 'Entities and papers appear here as the agent finds them.' : 'No graph for this answer.'}
              </p>
            )}

            <KnowledgeGraph nodes={nodes} edges={edges} onNodeClick={setSelectedNode} className="h-full w-full pt-10" />

            <ul className="card absolute bottom-3 right-3 m-0 flex list-none flex-col gap-1 p-2 text-xs text-muted" aria-label="Legend">
              {LEGEND.map(([label, dot]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{label}
                </li>
              ))}
            </ul>

            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="card absolute inset-x-3 top-14 flex items-start justify-between gap-2 p-3 text-sm shadow-md"
                  role="status"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{selectedNode.label}</span>
                    <span className="text-xs text-subtle">{selectedNode.type === 'paper' ? 'Paper' : selectedNode.type}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    aria-label="Dismiss"
                    className="rounded p-0.5 text-subtle hover:text-fg"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      )}
    </div>
  )
}

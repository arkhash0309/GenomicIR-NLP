import { useState, useCallback, useId, useRef, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useSSE, type SSEEvent } from '../hooks/useSSE'
import { useGraph } from '../hooks/useGraph'
import KnowledgeGraph from '../components/KnowledgeGraph'
import ReasoningTrace, { type TraceEntry } from '../components/ReasoningTrace'
import AnswerCard from '../components/AnswerCard'
import KeyboardHint from '../components/KeyboardHint'
import type { GraphNode } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const EXAMPLE_QUESTIONS = [
  'What is the role of BRCA1 in hereditary breast cancer?',
  'How does CRISPR-Cas9 enable genome editing and what are its limitations?',
  'What genes are associated with colorectal cancer in recent genomics studies?',
]

const LEGEND_ITEMS: [string, string][] = [
  ['Paper',    '#3b82f6'],
  ['Gene',     '#10b981'],
  ['Disease',  '#f43f5e'],
  ['Chemical', '#f59e0b'],
]

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

export default function Ask() {
  const [searchParams] = useSearchParams()
  const [question, setQuestion] = useState(() => searchParams.get('q') ?? '')
  const [active, setActive] = useState(false)
  const [trace, setTrace] = useState<TraceEntry[]>([])
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const { nodes, edges, addNodes, addEdges, reset } = useGraph()
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setQuestion(q)
  }, [searchParams])

  const { stream, cancel } = useSSE()
  const { error: toastError } = useToast()
  const uid = useId()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const traceSeq = useRef(0)
  const reduced = useReducedMotion()

  useDocumentTitle('Research Assistant')
  useKeyboardShortcut({ '/': () => { inputRef.current?.focus(); inputRef.current?.select() } })

  const handleEvent = useCallback((e: SSEEvent) => {
    if (e.type === 'reasoning') {
      setTrace(prev => {
        const last = prev[prev.length - 1]
        if (last?.kind === 'reasoning') {
          return [...prev.slice(0, -1), { ...last, text: last.text + (e.text as string) }]
        }
        return [...prev, { id: `${uid}-${traceSeq.current++}`, kind: 'reasoning', text: e.text as string }]
      })
    } else if (e.type === 'tool_call') {
      setTrace(prev => [...prev, { id: `${uid}-${traceSeq.current++}`, kind: 'tool_call', text: `${e.tool}(${JSON.stringify(e.input ?? {}).slice(0, 60)}…)` }])
    } else if (e.type === 'tool_result') {
      setTrace(prev => [...prev, { id: `${uid}-${traceSeq.current++}`, kind: 'tool_result', text: (e.summary as string).slice(0, 120) }])
    } else if (e.type === 'graph_update') {
      addNodes(e.nodes as GraphNode[])
      addEdges(e.edges as any[])
    } else if (e.type === 'done') {
      setCitations(e.citations as string[])
      setActive(false)
    }
  }, [addNodes, addEdges, uid])

  const handleAsk = async () => {
    if (!question.trim() || active) return
    cancel()
    reset()
    setTrace([])
    setAnswer('')
    setCitations([])
    setActive(true)
    traceSeq.current = 0

    let answerBuf = ''
    try {
      await stream(
        'http://localhost:8000/ask',
        { question },
        (e) => {
          if (e.type === 'reasoning') {
            answerBuf += e.text as string
            setAnswer(answerBuf)
          } else if (e.type === 'tool_call') {
            answerBuf = ''
            setAnswer('')
          }
          handleEvent(e)
        }
      )
    } catch {
      toastError('Connection to research assistant failed — is the backend running?')
      setActive(false)
    }
  }

  const hasSession = active || trace.length > 0

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-genomic-cyan/10 flex items-center justify-center text-genomic-cyan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Research Assistant</h1>
          {active && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-genomic-cyan bg-genomic-cyan/10 px-2.5 py-1 rounded-full border border-genomic-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-genomic-cyan animate-pulse" />
              Thinking…
            </span>
          )}
        </div>
        <p className="text-[var(--text-40)] text-sm">
          Claude agent with hybrid FAISS + BM25 retrieval and live knowledge graph construction
        </p>
      </motion.header>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5"
      >
        <div
          className={`flex gap-3 p-1.5 glass rounded-2xl transition-all duration-300 ${
            active ? 'border-genomic-cyan/25' : ''
          }`}
          role="group"
          aria-label="Ask a genomics question"
        >
          <label htmlFor={inputId} className="sr-only">Genomics research question</label>
          <input
            id={inputId}
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Ask a genomics question — e.g. What is the role of TP53 in tumour suppression?"
            aria-label="Genomics research question"
            aria-describedby="ask-hint"
            disabled={active}
            autoComplete="off"
            className="flex-1 bg-transparent px-4 py-3.5 text-[var(--text-100)] placeholder-white/25 focus:outline-none text-sm leading-relaxed disabled:opacity-60"
          />
          <motion.button
            onClick={active ? cancel : handleAsk}
            disabled={!active && !question.trim()}
            aria-label={active ? 'Cancel query' : 'Submit question'}
            aria-busy={active}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shrink-0 ${
              active
                ? 'bg-white/8 hover:bg-white/12 text-white/60 border border-white/10'
                : 'bg-genomic-cyan text-navy-DEFAULT hover:bg-genomic-cyan/90 disabled:opacity-40'
            }`}
            style={!active ? { boxShadow: question.trim() ? '0 0 20px rgba(6,182,212,0.3)' : 'none' } : {}}
          >
            {active ? (
              <><StopIcon /><span>Cancel</span></>
            ) : (
              <><SendIcon /><span>Ask</span></>
            )}
          </motion.button>
        </div>

        <div className="flex items-center gap-4 mt-2.5 px-1">
          <p id="ask-hint" className="sr-only">Press Enter or click Ask to submit your genomics research question</p>
          <div className="flex gap-3">
            <KeyboardHint keys={['/']} label="to focus" />
            <KeyboardHint keys={['↵']} label="to ask" />
          </div>
        </div>
      </motion.div>

      {/* Example questions */}
      <AnimatePresence>
        {!hasSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--text-25)] mb-3 px-1">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Example questions">
              {EXAMPLE_QUESTIONS.map(q => (
                <motion.button
                  key={q}
                  onClick={() => setQuestion(q)}
                  aria-label={`Use example question: ${q}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs glass px-3.5 py-2 rounded-xl text-[var(--text-50)] hover:text-[var(--text-80,rgba(240,244,255,0.8))] hover:border-genomic-cyan/20 transition-all text-left"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session panel */}
      <AnimatePresence>
        {hasSession && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[520px] mb-4"
            aria-label="Research session panel"
          >
            <ReasoningTrace entries={trace} active={active} />

            {/* Knowledge graph panel */}
            <div
              className="glass rounded-2xl overflow-hidden relative"
              style={{ boxShadow: nodes.length > 0 ? '0 0 0 1px rgba(168,85,247,0.12), inset 0 1px 0 rgba(255,255,255,0.04)' : undefined }}
              aria-label="Live knowledge graph"
            >
              {/* Panel header */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] z-10 bg-[rgba(4,8,15,0.6)] backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${active && nodes.length === 0 ? 'bg-genomic-amber animate-pulse' : nodes.length > 0 ? 'bg-genomic-violet' : 'bg-white/20'}`} />
                  <span className="text-[10px] font-mono text-white/35">knowledge.graph</span>
                </div>
                {nodes.length > 0 && (
                  <span className="text-[10px] font-mono text-white/30">{nodes.length}n · {edges.length}e</span>
                )}
              </div>

              {nodes.length === 0 && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-white/15 text-sm font-mono gap-2 pt-10"
                  aria-live="polite"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1" opacity="0.4" aria-hidden="true">
                    <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
                    <path d="M7 12h10M17 6.7l-6 4M17 17.3l-6-4"/>
                  </svg>
                  <span>{active ? 'Graph building…' : 'No graph data yet'}</span>
                </div>
              )}

              <KnowledgeGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={setSelectedNode}
                className="w-full h-full pt-9"
              />

              {/* Selected node tooltip */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 text-xs"
                    role="status"
                    aria-label={`Selected node: ${selectedNode.label}, type: ${selectedNode.type}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{selectedNode.label}</span>
                        <span className="ml-2 text-white/35 font-mono text-[10px]">{selectedNode.type}</span>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        aria-label="Dismiss selected node"
                        className="text-white/25 hover:text-white/60 transition-colors ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div
                className="absolute top-10 right-3 glass rounded-xl p-2.5 flex flex-col gap-1.5"
                role="list"
                aria-label="Graph node type legend"
              >
                {LEGEND_ITEMS.map(([t, c]) => (
                  <div key={t} role="listitem" className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} aria-hidden="true" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnswerCard answer={answer} citations={citations} />
    </div>
  )
}

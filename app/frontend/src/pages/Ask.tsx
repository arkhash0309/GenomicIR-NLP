import { useState, useCallback, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSSE, type SSEEvent } from '../hooks/useSSE'
import { useGraph } from '../hooks/useGraph'
import KnowledgeGraph from '../components/KnowledgeGraph'
import ReasoningTrace, { type TraceEntry } from '../components/ReasoningTrace'
import AnswerCard from '../components/AnswerCard'
import type { GraphNode } from '../lib/api'

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

export default function Ask() {
  const [question, setQuestion] = useState('')
  const [active, setActive] = useState(false)
  const [trace, setTrace] = useState<TraceEntry[]>([])
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const { nodes, edges, addNodes, addEdges, reset } = useGraph()
  const { stream, cancel } = useSSE()
  const uid = useId()
  const inputId = useId()
  const traceSeq = useRef(0)

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
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Research Assistant</h1>
        <p className="text-white/50">Claude agent with hybrid search + live knowledge graph</p>
      </header>

      {/* Question input */}
      <div className="flex gap-3 mb-4" role="group" aria-label="Ask a genomics question">
        <label htmlFor={inputId} className="sr-only">Genomics research question</label>
        <input
          id={inputId}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a genomics question…"
          aria-label="Genomics research question"
          aria-describedby="ask-hint"
          disabled={active}
          autoComplete="off"
          className="flex-1 glass rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 border border-white/10 transition-colors disabled:opacity-60"
        />
        <button
          onClick={handleAsk}
          disabled={active || !question.trim()}
          aria-label={active ? 'Processing query…' : 'Submit question'}
          aria-busy={active}
          className="px-6 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors"
        >
          {active ? (
            <>
              <span className="sr-only">Processing query, please wait…</span>
              <span aria-hidden="true" className="animate-pulse">Thinking…</span>
            </>
          ) : 'Ask'}
        </button>
      </div>
      <p id="ask-hint" className="sr-only">Press Enter or click Ask to submit your genomics research question</p>

      {/* Example questions */}
      {!active && trace.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Example questions">
          {EXAMPLE_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              aria-label={`Use example question: ${q}`}
              className="text-xs glass px-3 py-2 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Split panel: trace + graph */}
      {(active || trace.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]"
          aria-label="Research session panel"
        >
          <ReasoningTrace entries={trace} active={active} />

          <div className="glass rounded-2xl overflow-hidden relative" aria-label="Live knowledge graph">
            {nodes.length === 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center text-white/20 text-sm font-mono"
                aria-live="polite"
              >
                {active ? 'Graph building…' : 'No graph data yet'}
              </div>
            )}
            <KnowledgeGraph
              nodes={nodes}
              edges={edges}
              onNodeClick={setSelectedNode}
              className="w-full h-full"
            />

            {selectedNode && (
              <div
                className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 text-xs"
                role="status"
                aria-label={`Selected node: ${selectedNode.label}, type: ${selectedNode.type}`}
              >
                <span className="font-semibold text-white">{selectedNode.label}</span>
                <span className="ml-2 text-white/40">{selectedNode.type}</span>
                <button
                  onClick={() => setSelectedNode(null)}
                  aria-label="Dismiss selected node"
                  className="float-right text-white/30 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Legend */}
            <div
              className="absolute top-4 right-4 glass rounded-lg p-2 flex flex-col gap-1"
              role="list"
              aria-label="Graph node type legend"
            >
              {LEGEND_ITEMS.map(([t, c]) => (
                <div key={t} role="listitem" className="flex items-center gap-1.5 text-xs text-white/60">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }} aria-hidden="true" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <AnswerCard answer={answer} citations={citations} />
    </div>
  )
}

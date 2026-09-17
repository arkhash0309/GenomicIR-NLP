import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, type SubgraphResponse, type GraphNode } from '../lib/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import EntityChip from '../components/EntityChip'
import Spinner from '../components/Spinner'
import { useToast } from '../contexts/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const EXAMPLES = [
  { label: 'BRCA1 + breast cancer', query: 'BRCA1, breast cancer' },
  { label: 'CRISPR + Cas9',         query: 'CRISPR, Cas9' },
  { label: 'p53 + apoptosis',       query: 'p53, apoptosis' },
  { label: 'Dopamine + Parkinson',  query: 'dopamine, Parkinson' },
]

function NetworkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
      <path d="M7 12h10M17 6.7l-6 4M17 17.3l-6-4"/>
    </svg>
  )
}

export default function GraphExplorer() {
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<SubgraphResponse>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)
  const inputId = useId()
  const { error } = useToast()
  useDocumentTitle('Graph Explorer')

  const explore = async (q?: string) => {
    const target = q ?? query
    if (!target.trim()) return
    if (q) setQuery(q)
    setLoading(true)
    try {
      const names = target.split(',').map(s => s.trim()).filter(Boolean)
      const data = await api.subgraph(names)
      setGraph(data)
      setSelected(null)
      if (data.nodes.length === 0) {
        error('No entities found — try different names or check spelling.')
      }
    } catch {
      error('Graph query failed — check that the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const entityNodes = graph.nodes.filter(n => n.type !== 'paper')
  const paperNodes  = graph.nodes.filter(n => n.type === 'paper')

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
          <div className="w-8 h-8 rounded-xl bg-genomic-violet/10 flex items-center justify-center text-genomic-violet">
            <NetworkIcon />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Graph Explorer</h1>
        </div>
        <p className="text-[var(--text-40)] text-sm">
          Explore the biomedical entity co-occurrence network extracted from 7,000+ paper abstracts
        </p>
      </motion.header>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex gap-3 p-1.5 glass rounded-2xl mb-3" role="group" aria-label="Entity search">
          <label htmlFor={inputId} className="sr-only">
            Comma-separated entity names (e.g. BRCA1, breast cancer)
          </label>
          <input
            id={inputId}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && explore()}
            placeholder="BRCA1, breast cancer, doxorubicin…"
            aria-label="Enter comma-separated entity names to explore"
            aria-describedby="explorer-hint"
            className="flex-1 bg-transparent px-4 py-3 text-[var(--text-100)] placeholder-white/25 focus:outline-none text-sm"
          />
          <button
            onClick={() => explore()}
            disabled={loading || !query.trim()}
            aria-label={loading ? 'Loading graph…' : 'Explore entity graph'}
            aria-busy={loading}
            className="px-5 py-2.5 bg-genomic-violet text-white font-semibold rounded-xl hover:bg-genomic-violet/90 disabled:opacity-40 transition-colors flex items-center gap-2 text-sm"
            style={{ boxShadow: query.trim() ? '0 0 20px rgba(168,85,247,0.3)' : 'none' }}
          >
            {loading ? <Spinner size="sm" label="Loading graph…" /> : <NetworkIcon />}
            <span>Explore</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap px-1">
          <p id="explorer-hint" className="text-[11px] text-[var(--text-25)] font-mono mr-1">
            Comma-separated entities
          </p>
          <span className="text-white/10">·</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.query}
              onClick={() => explore(ex.query)}
              className="text-[11px] font-mono text-genomic-violet/60 hover:text-genomic-violet glass px-2.5 py-1 rounded-lg transition-colors hover:border-genomic-violet/20"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Live status */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {graph.nodes.length > 0
          ? `Graph loaded: ${graph.nodes.length} nodes and ${graph.edges.length} connections`
          : ''}
      </div>

      {/* Empty state */}
      <AnimatePresence>
        {graph.nodes.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-10 text-center max-w-lg mx-auto mt-4"
            style={{
              background: 'rgba(4,8,15,0.5)',
              border: '1px solid rgba(168,85,247,0.1)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-genomic-violet/8 flex items-center justify-center mx-auto mb-5 text-genomic-violet/40"
                 style={{ background: 'rgba(168,85,247,0.07)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
                <path d="M7 12h10M17 6.7l-6 4M17 17.3l-6-4"/>
              </svg>
            </div>
            <h2 className="text-[var(--text-65,rgba(240,244,255,0.65))] font-semibold mb-2">
              Explore the entity network
            </h2>
            <p className="text-[var(--text-35,rgba(240,244,255,0.35))] text-sm mb-6 leading-relaxed">
              Enter biomedical entity names above to see how genes, diseases,
              and chemicals co-occur across 7,000+ papers.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph + panel */}
      <AnimatePresence>
        {graph.nodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Main graph */}
            <div
              className="lg:col-span-2 rounded-2xl overflow-hidden relative"
              style={{
                height: 600,
                background: 'rgba(4,8,15,0.7)',
                border: '1px solid rgba(168,85,247,0.12)',
                boxShadow: '0 0 0 1px rgba(168,85,247,0.06), 0 24px 64px rgba(0,0,0,0.35)',
              }}
              aria-label={`Entity co-occurrence graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`}
            >
              {/* Header bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] z-10 bg-[rgba(4,8,15,0.6)] backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-genomic-violet" />
                  <span className="text-[10px] font-mono text-white/30">entity.graph</span>
                </div>
                <span className="text-[10px] font-mono text-white/20">
                  {graph.nodes.length}n · {graph.edges.length}e
                </span>
              </div>
              <KnowledgeGraph
                nodes={graph.nodes}
                edges={graph.edges}
                onNodeClick={setSelected}
                className="w-full h-full pt-9"
              />
            </div>

            {/* Side panel */}
            <aside className="space-y-3" aria-label="Graph details">
              {/* Summary */}
              <div className="rounded-2xl p-4"
                   style={{ background: 'rgba(4,8,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-30)] mb-3">
                  Summary
                </h2>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-40)]">Total nodes</span>
                    <span className="font-mono text-[var(--text-70)] tabular-nums">{graph.nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-40)]">Total edges</span>
                    <span className="font-mono text-[var(--text-70)] tabular-nums">{graph.edges.length}</span>
                  </div>
                  <div className="w-full h-px my-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-40)]">Entities</span>
                    <span className="font-mono text-genomic-violet tabular-nums">{entityNodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-40)]">Papers</span>
                    <span className="font-mono text-genomic-cyan tabular-nums">{paperNodes.length}</span>
                  </div>
                </div>
              </div>

              {/* Selected node */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(168,85,247,0.06)',
                      border: '1px solid rgba(168,85,247,0.15)',
                    }}
                    role="status"
                    aria-label={`Selected node: ${selected.label}`}
                  >
                    <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-genomic-violet/60 mb-2.5">
                      Selected
                    </h2>
                    <p className="font-semibold text-[var(--text-90)] mb-2.5">{selected.label}</p>
                    {selected.type !== 'paper' && (
                      <EntityChip name={selected.type} type={selected.type as any} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Entity list */}
              <div
                className="rounded-2xl p-4 max-h-64 overflow-y-auto"
                style={{ background: 'rgba(4,8,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                aria-label="Entity nodes list"
              >
                <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--text-30)] mb-3">
                  Entity nodes ({entityNodes.length})
                </h2>
                <div className="flex flex-wrap gap-1.5" role="list" aria-label="Entities in graph">
                  {entityNodes.map(n => (
                    <div key={n.id} role="listitem">
                      <EntityChip
                        name={n.label}
                        type={n.type as any}
                        onClick={() => setSelected(n)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

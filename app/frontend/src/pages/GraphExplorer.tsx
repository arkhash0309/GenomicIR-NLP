import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { api, type SubgraphResponse, type GraphNode } from '../lib/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import EntityChip from '../components/EntityChip'

export default function GraphExplorer() {
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<SubgraphResponse>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)
  const inputId = useId()

  const explore = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const names = query.split(',').map(s => s.trim()).filter(Boolean)
      const data = await api.subgraph(names)
      setGraph(data)
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const entityNodes = graph.nodes.filter(n => n.type !== 'paper')
  const paperNodes  = graph.nodes.filter(n => n.type === 'paper')

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Graph Explorer</h1>
        <p className="text-white/50">Explore biomedical entity co-occurrence network</p>
      </header>

      <div className="flex gap-3 mb-6" role="group" aria-label="Entity search">
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
          className="flex-1 glass rounded-xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 border border-white/10"
        />
        <button
          onClick={explore}
          disabled={loading || !query.trim()}
          aria-label={loading ? 'Loading graph…' : 'Explore entity graph'}
          aria-busy={loading}
          className="px-5 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <span className="sr-only">Loading…</span>
              <span aria-hidden="true">…</span>
            </>
          ) : 'Explore'}
        </button>
      </div>
      <p id="explorer-hint" className="text-white/30 text-xs mb-6">
        Enter one or more biomedical entity names separated by commas, then press Enter or click Explore.
      </p>

      {/* Live region for graph updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {graph.nodes.length > 0
          ? `Graph loaded: ${graph.nodes.length} nodes and ${graph.edges.length} connections`
          : ''}
      </div>

      {graph.nodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Graph */}
          <div
            className="lg:col-span-2 glass rounded-2xl h-[600px] overflow-hidden"
            aria-label={`Entity co-occurrence graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`}
          >
            <KnowledgeGraph
              nodes={graph.nodes}
              edges={graph.edges}
              onNodeClick={setSelected}
              className="w-full h-full"
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4" aria-label="Graph details">
            <div className="glass rounded-2xl p-4">
              <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">Summary</h2>
              <p className="text-white text-sm">
                <span aria-label={`${graph.nodes.length} total nodes`}>{graph.nodes.length} nodes</span>
                <span aria-hidden="true"> · </span>
                <span aria-label={`${graph.edges.length} total edges`}>{graph.edges.length} edges</span>
              </p>
              <p className="text-white/50 text-xs mt-1">
                {entityNodes.length} entities · {paperNodes.length} papers
              </p>
            </div>

            {selected && (
              <div className="glass rounded-2xl p-4" role="status" aria-label={`Selected node: ${selected.label}`}>
                <h2 className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Selected</h2>
                <p className="font-semibold text-white mb-2">{selected.label}</p>
                {selected.type !== 'paper' && (
                  <EntityChip name={selected.type} type={selected.type as any} />
                )}
              </div>
            )}

            <div className="glass rounded-2xl p-4 max-h-72 overflow-y-auto" aria-label="Entity nodes list">
              <h2 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider">
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
    </div>
  )
}

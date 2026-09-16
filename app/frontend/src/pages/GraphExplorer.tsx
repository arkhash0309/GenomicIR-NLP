// src/pages/GraphExplorer.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { api, type SubgraphResponse, type GraphNode } from '../lib/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import EntityChip from '../components/EntityChip'

export default function GraphExplorer() {
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<SubgraphResponse>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)

  const explore = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const names = query.split(',').map(s => s.trim()).filter(Boolean)
      const data = await api.subgraph(names)
      setGraph(data)
    } finally {
      setLoading(false)
    }
  }

  const entityNodes = graph.nodes.filter(n => n.type !== 'paper')
  const paperNodes = graph.nodes.filter(n => n.type === 'paper')

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Graph Explorer</h1>
      <p className="text-white/50 mb-8">Explore biomedical entity co-occurrence network. Enter comma-separated entity names.</p>

      <div className="flex gap-3 mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && explore()}
          placeholder="BRCA1, breast cancer, doxorubicin…"
          className="flex-1 glass rounded-xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 border border-white/10" />
        <button onClick={explore} disabled={loading}
          className="px-5 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors">
          {loading ? '…' : 'Explore'}
        </button>
      </div>

      {graph.nodes.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-4">
          <div className="col-span-2 glass rounded-2xl h-[600px] overflow-hidden">
            <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={setSelected} className="w-full h-full" />
          </div>
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-3">Summary</p>
              <p className="text-white text-sm">{graph.nodes.length} nodes · {graph.edges.length} edges</p>
              <p className="text-white/50 text-xs mt-1">{entityNodes.length} entities · {paperNodes.length} papers</p>
            </div>

            {selected && (
              <div className="glass rounded-2xl p-4">
                <p className="text-white/40 text-xs mb-2">Selected</p>
                <p className="font-semibold text-white">{selected.label}</p>
                <EntityChip name={selected.type} type={selected.type as any} />
              </div>
            )}

            <div className="glass rounded-2xl p-4 max-h-64 overflow-y-auto">
              <p className="text-white/40 text-xs mb-3">Entity nodes</p>
              <div className="flex flex-wrap gap-1.5">
                {entityNodes.map(n => (
                  <EntityChip key={n.id} name={n.label} type={n.type as any}
                    onClick={() => setSelected(n)} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

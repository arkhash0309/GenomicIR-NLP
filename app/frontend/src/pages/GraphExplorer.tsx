import { useState, type FormEvent } from 'react'
import { Network } from 'lucide-react'
import { api, type SubgraphResponse, type GraphNode } from '../lib/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import EntityChip, { type EntityType } from '../components/EntityChip'
import Spinner from '../components/Spinner'
import { AnimatedNumber } from '../components/ui/animated-number'
import { useToast } from '../contexts/ToastContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const EXAMPLES = [
  'BRCA1, breast cancer',
  'CRISPR, Cas9',
  'p53, apoptosis',
  'dopamine, Parkinson',
]

const LEGEND: [string, string][] = [
  ['Paper',    'bg-entity-paper'],
  ['Gene',     'bg-entity-gene'],
  ['Disease',  'bg-entity-disease'],
  ['Chemical', 'bg-entity-chemical'],
]

export default function GraphExplorer() {
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<SubgraphResponse>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)
  const { error } = useToast()
  useDocumentTitle('Graph explorer')

  const explore = async (target: string) => {
    if (!target.trim()) return
    setQuery(target)
    setLoading(true)
    try {
      const names = target.split(',').map(s => s.trim()).filter(Boolean)
      const data = await api.subgraph(names)
      setGraph(data)
      setSelected(null)
      if (data.nodes.length === 0) error('None of those entities are in the graph. Try another spelling.')
    } catch {
      error('Graph query failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); explore(query) }

  const entityNodes = graph.nodes.filter(n => n.type !== 'paper')
  const paperNodes  = graph.nodes.filter(n => n.type === 'paper')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Graph explorer</h1>
        <p className="mt-1 text-sm text-muted">
          Genes, diseases and chemicals extracted from abstracts with scispaCy, linked when they appear in the same paper.
        </p>
      </header>

      <form onSubmit={submit} className="card mb-3 flex items-center gap-2 p-1.5 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
        <Network size={16} className="ml-2 shrink-0 text-subtle" aria-hidden="true" />
        <label htmlFor="graph-input" className="sr-only">Entities, comma-separated</label>
        <input
          id="graph-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Entities, comma-separated — e.g. BRCA1, breast cancer"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-fg placeholder:text-subtle focus:outline-none"
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary min-w-[5.5rem] shrink-0 px-3">
          {loading ? <Spinner size="sm" label="Loading graph…" /> : 'Explore'}
        </button>
      </form>

      <ul className="m-0 mb-8 flex list-none flex-wrap gap-1.5 p-0 px-1" aria-label="Examples">
        {EXAMPLES.map(ex => (
          <li key={ex}>
            <button type="button" onClick={() => explore(ex)}
                    className="rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg">
              {ex}
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="sr-only">
        {graph.nodes.length > 0 ? `Graph loaded: ${graph.nodes.length} nodes, ${graph.edges.length} edges` : ''}
      </div>

      {graph.nodes.length === 0 && !loading && (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <Network size={24} className="mb-3 text-subtle" aria-hidden="true" />
          <p className="text-sm text-fg">Enter one or more entities to see what they co-occur with.</p>
          <p className="mt-1 text-sm text-subtle">Drag nodes to rearrange; scroll to zoom.</p>
        </div>
      )}

      {graph.nodes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="card relative h-[560px] overflow-hidden" aria-label="Entity co-occurrence graph">
            <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={setSelected} className="h-full w-full" />
            <ul className="card absolute bottom-3 right-3 m-0 flex list-none flex-col gap-1 p-2 text-xs text-muted" aria-label="Legend">
              {LEGEND.map(([label, dot]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{label}
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-3" aria-label="Graph details">
            <dl className="card grid grid-cols-2 gap-px overflow-hidden bg-line p-0">
              {[
                ['Nodes', graph.nodes.length],
                ['Edges', graph.edges.length],
                ['Entities', entityNodes.length],
                ['Papers', paperNodes.length],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="text-xs text-subtle">{label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold"><AnimatedNumber value={value as number} /></dd>
                </div>
              ))}
            </dl>

            {selected && (
              <div className="card p-4" role="status">
                <p className="eyebrow mb-1">Selected</p>
                <p className="font-medium">{selected.label}</p>
                <p className="text-xs text-subtle">{selected.type === 'paper' ? 'Paper' : selected.type}</p>
              </div>
            )}

            <div className="card max-h-72 overflow-y-auto p-4">
              <h2 className="eyebrow mb-2">Entities ({entityNodes.length})</h2>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {entityNodes.map(n => (
                  <li key={n.id}>
                    <EntityChip
                      name={n.label}
                      type={n.type as EntityType}
                      selected={selected?.id === n.id}
                      onClick={() => setSelected(n)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

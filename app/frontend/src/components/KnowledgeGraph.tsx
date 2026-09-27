import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Minus, Plus } from 'lucide-react'
import type { GraphNode, GraphEdge } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'

const NODE_TOKEN: Record<string, string> = {
  paper: '--entity-paper', Gene: '--entity-gene', Disease: '--entity-disease', Chemical: '--entity-chemical',
}
const NODE_RADIUS: Record<string, number> = {
  paper: 9, Gene: 6.5, Disease: 6.5, Chemical: 6.5,
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  className?: string
}

type SimNode = GraphNode & d3.SimulationNodeDatum
type SimEdge = { source: SimNode | string; target: SimNode | string; type: string; weight: number }

/** Read a colour token from CSS so the graph follows the active theme. */
function token(name: string, alpha = 1): string {
  const rgb = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return rgb ? `rgb(${rgb} / ${alpha})` : '#888'
}
const nodeFill = (type: string) => token(NODE_TOKEN[type] ?? '--subtle')
const edgeColor = () => token('--line-strong', 0.8)
const nodeStroke = () => token('--canvas')
const labelColor = () => token('--muted')

export default function KnowledgeGraph({ nodes, edges, onNodeClick, className }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const simRef  = useRef<d3.Simulation<SimNode, SimEdge> | null>(null)
  const gRef    = useRef<SVGGElement | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [scale, setScale] = useState(1)
  const { theme, highContrast } = useTheme()

  const applyZoom = useCallback((factor: number) => {
    if (!svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(250).call(
      zoomRef.current.scaleBy as any, factor
    )
  }, [])

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(300).call(
      zoomRef.current.transform as any, d3.zoomIdentity
    )
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    svg.selectAll('*').remove()
    const g = svg.append('g')
    gRef.current = g.node()
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 6])
      .on('zoom', ev => {
        g.attr('transform', ev.transform)
        setScale(ev.transform.k)
      })
    zoomRef.current = zoom
    svg.call(zoom)
    return () => { simRef.current?.stop() }
  }, [])

  useEffect(() => {
    if (!gRef.current || !svgRef.current) return
    const svg = svgRef.current
    const w = svg.clientWidth || 800
    const h = svg.clientHeight || 600
    const g = d3.select(gRef.current)

    const simNodes: SimNode[] = nodes.map(n => ({ ...n }))
    const nodeMap = new Map(simNodes.map(n => [n.id, n]))
    const simEdges: SimEdge[] = edges
      .filter(e => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map(e => ({ ...e, source: e.source, target: e.target }))

    if (!simRef.current) {
      simRef.current = d3.forceSimulation<SimNode>()
        .force('link', d3.forceLink<SimNode, SimEdge>().id(d => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force('collision', d3.forceCollide(18))
        // Weak pull toward the centre so unconnected nodes stay in view.
        .force('x', d3.forceX(w / 2).strength(0.06))
        .force('y', d3.forceY(h / 2).strength(0.06))
    }

    const sim = simRef.current
    sim.nodes(simNodes)
    ;(sim.force('link') as d3.ForceLink<SimNode, SimEdge>).links(simEdges)
    ;(sim.force('center') as d3.ForceCenter<SimNode>)?.x(w / 2).y(h / 2)
    ;(sim.force('x') as d3.ForceX<SimNode>)?.x(w / 2)
    ;(sim.force('y') as d3.ForceY<SimNode>)?.y(h / 2)

    g.selectAll<SVGLineElement, SimEdge>('.edge')
      .data(simEdges, d => `${d.source as string}-${d.target as string}`)
      .join(
        enter => enter.append('line').attr('class', 'edge')
          .attr('stroke', edgeColor())
          .attr('stroke-width', d => Math.min(3, 0.75 + Math.log1p(d.weight || 1) / 2)),
        update => update.attr('stroke', edgeColor()),
        exit => exit.remove()
      )

    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y })
      .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null })

    g.selectAll<SVGGElement, SimNode>('.node')
      .data(simNodes, d => d.id)
      .join(
        enter => {
          const eg = enter.append('g').attr('class', 'node').style('cursor', 'pointer')
            .attr('role', 'button')
            .attr('tabindex', '0')
            .attr('aria-label', d => `${d.type}: ${d.label}`)
            .call(drag)
            .on('click', (_, d) => onNodeClick?.(d))
            .on('keydown', (ev, d) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                onNodeClick?.(d)
              }
            })
          eg.append('circle')
            .attr('r', 0)
            .attr('fill', d => nodeFill(d.type))
            .attr('stroke', nodeStroke())
            .attr('stroke-width', 1.5)
            .transition().duration(400).attr('r', d => NODE_RADIUS[d.type] ?? 7)
          eg.append('text')
            .attr('class', 'node-label')
            .attr('x', d => (NODE_RADIUS[d.type] ?? 7) + 4)
            .attr('y', 3.5)
            .attr('font-size', 10.5)
            .attr('fill', labelColor())
            .style('pointer-events', 'none')
            .text(d => (d.label.length > 28 ? `${d.label.slice(0, 27)}…` : d.label))
          eg.append('title').text(d => `${d.type}: ${d.label}`)
          return eg
        },
        update => update,
        exit => exit.transition().duration(200).remove()
      )

    sim.on('tick', () => {
      g.selectAll<SVGLineElement, SimEdge>('.edge')
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0)
      g.selectAll<SVGGElement, SimNode>('.node')
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    sim.alpha(0.4).restart()
  }, [nodes, edges, onNodeClick])

  // Re-colour existing nodes/edges when the theme or contrast mode changes.
  // Deferred a frame: ThemeProvider (a parent) applies the <html> class in its
  // own effect, which runs after this one.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!gRef.current) return
      const g = d3.select(gRef.current)
      g.selectAll<SVGLineElement, SimEdge>('.edge').attr('stroke', edgeColor())
      g.selectAll<SVGCircleElement, SimNode>('.node circle')
        .attr('fill', d => nodeFill(d.type))
        .attr('stroke', nodeStroke())
      g.selectAll<SVGTextElement, SimNode>('.node-label').attr('fill', labelColor())
    })
    return () => cancelAnimationFrame(id)
  }, [theme, highContrast])

  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
        role="img"
        aria-label={`Knowledge graph with ${nodes.length} nodes and ${edges.length} connections. Use scroll to zoom, drag to pan.`}
      />

      {/* Zoom controls for keyboard/pointer users */}
      {nodes.length > 0 && (
        <div
          className="card absolute bottom-3 left-3 flex items-center overflow-hidden text-muted shadow-sm"
          role="group"
          aria-label="Graph zoom controls"
        >
          <button type="button" onClick={() => applyZoom(1 / 1.4)} aria-label="Zoom out"
                  className="flex h-7 w-7 items-center justify-center hover:bg-surface-2 hover:text-fg">
            <Minus size={14} aria-hidden="true" />
          </button>
          <button type="button" onClick={resetZoom} aria-label="Reset zoom" title="Reset zoom"
                  className="h-7 border-x border-line px-2 font-mono text-xs tabular-nums hover:bg-surface-2 hover:text-fg">
            {Math.round(scale * 100)}%
          </button>
          <button type="button" onClick={() => applyZoom(1.4)} aria-label="Zoom in"
                  className="flex h-7 w-7 items-center justify-center hover:bg-surface-2 hover:text-fg">
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '../lib/api'

const NODE_COLOR: Record<string, string> = {
  paper: '#3b82f6', Gene: '#10b981', Disease: '#f43f5e', Chemical: '#f59e0b',
}
const NODE_RADIUS: Record<string, number> = {
  paper: 10, Gene: 7, Disease: 7, Chemical: 7,
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  className?: string
}

type SimNode = GraphNode & d3.SimulationNodeDatum
type SimEdge = { source: SimNode | string; target: SimNode | string; type: string; weight: number }

function getThemeEdgeColor() {
  return document.documentElement.classList.contains('light')
    ? 'rgba(15,23,42,0.18)'
    : 'rgba(255,255,255,0.14)'
}
function getThemeNodeStroke() {
  return document.documentElement.classList.contains('light')
    ? 'rgba(15,23,42,0.22)'
    : 'rgba(255,255,255,0.30)'
}

export default function KnowledgeGraph({ nodes, edges, onNodeClick, className }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const simRef  = useRef<d3.Simulation<SimNode, SimEdge> | null>(null)
  const gRef    = useRef<SVGGElement | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [scale, setScale] = useState(1)

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
    }

    const sim = simRef.current
    sim.nodes(simNodes)
    ;(sim.force('link') as d3.ForceLink<SimNode, SimEdge>).links(simEdges)
    ;(sim.force('center') as d3.ForceCenter<SimNode>)?.x(w / 2).y(h / 2)

    g.selectAll<SVGLineElement, SimEdge>('.edge')
      .data(simEdges, d => `${d.source as string}-${d.target as string}`)
      .join(
        enter => enter.append('line').attr('class', 'edge')
          .attr('stroke', getThemeEdgeColor())
          .attr('stroke-width', d => Math.sqrt(d.weight || 1)),
        update => update.attr('stroke', getThemeEdgeColor()),
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
            .attr('fill', d => NODE_COLOR[d.type] ?? '#6b7280')
            .attr('stroke', getThemeNodeStroke())
            .attr('stroke-width', 1.5)
            .transition().duration(400).attr('r', d => NODE_RADIUS[d.type] ?? 7)
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
          className="absolute bottom-3 left-3 flex items-center gap-1"
          role="group"
          aria-label="Graph zoom controls"
        >
          <button
            onClick={() => applyZoom(1.4)}
            aria-label="Zoom in"
            className="w-7 h-7 glass rounded flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm font-bold"
          >+</button>
          <button
            onClick={resetZoom}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="px-2 h-7 glass rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-colors font-mono text-xs"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => applyZoom(1 / 1.4)}
            aria-label="Zoom out"
            className="w-7 h-7 glass rounded flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm font-bold"
          >−</button>
        </div>
      )}
    </div>
  )
}

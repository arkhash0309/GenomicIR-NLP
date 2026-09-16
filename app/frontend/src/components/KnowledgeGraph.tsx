// src/components/KnowledgeGraph.tsx
import { useEffect, useRef } from 'react'
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

export default function KnowledgeGraph({ nodes, edges, onNodeClick, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null)
  const gRef = useRef<SVGGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    svg.selectAll('*').remove()
    const g = svg.append('g')
    gRef.current = g.node()
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 6])
        .on('zoom', ev => g.attr('transform', ev.transform))
    )
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

    g.selectAll<SVGLineElement, SimEdge>('.edge')
      .data(simEdges, d => `${(d.source as SimNode).id ?? d.source}-${(d.target as SimNode).id ?? d.target}`)
      .join(
        enter => enter.append('line').attr('class', 'edge')
          .attr('stroke', 'rgba(255,255,255,0.12)')
          .attr('stroke-width', d => Math.sqrt(d.weight || 1)),
        update => update,
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
            .call(drag)
            .on('click', (_, d) => onNodeClick?.(d))
          eg.append('circle')
            .attr('r', 0)
            .attr('fill', d => NODE_COLOR[d.type] ?? '#6b7280')
            .attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1.5)
            .transition().duration(400).attr('r', d => NODE_RADIUS[d.type] ?? 7)
          eg.append('title').text(d => d.label)
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
    <svg ref={svgRef} className={className ?? 'w-full h-full'}
      style={{ background: 'transparent' }} />
  )
}

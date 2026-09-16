// src/hooks/useGraph.ts
import { useState, useCallback } from 'react'
import type { GraphNode, GraphEdge } from '../lib/api'

export function useGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  const addNodes = useCallback((incoming: GraphNode[]) => {
    setNodes(prev => {
      const ids = new Set(prev.map(n => n.id))
      return [...prev, ...incoming.filter(n => !ids.has(n.id))]
    })
  }, [])

  const addEdges = useCallback((incoming: GraphEdge[]) => {
    setEdges(prev => {
      const keys = new Set(prev.map(e => `${e.source}-${e.target}`))
      return [...prev, ...incoming.filter(e => !keys.has(`${e.source}-${e.target}`))]
    })
  }, [])

  const reset = useCallback(() => { setNodes([]); setEdges([]) }, [])

  return { nodes, edges, addNodes, addEdges, reset }
}

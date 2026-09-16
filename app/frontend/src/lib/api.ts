// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Paper { id: number; title: string; authors: string; doi: string; date: string; url: string; abstract: string; summary: string }
export interface SearchResult { paper: Paper; score: number; rank: number }
export interface SearchResponse { query: string; results: SearchResult[] }
export interface Stats { paper_count: number; entity_count: number; edge_count: number; avg_abstract_words: number }
export interface PaperDetail extends Paper { entities: { name: string; type: string }[] }
export interface EntityResponse { entity: string; paper_count: number; papers: { id: number; title: string; doi: string }[]; connections: { name: string; type: string; weight: number }[] }
export interface GraphNode { id: string; label: string; type: 'paper' | 'Gene' | 'Disease' | 'Chemical' }
export interface GraphEdge { source: string; target: string; type: string; weight: number }
export interface SubgraphResponse { nodes: GraphNode[]; edges: GraphEdge[] }

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  stats: () => get<Stats>('/stats'),
  search: (q: string, k = 5) => get<SearchResponse>(`/search?q=${encodeURIComponent(q)}&k=${k}`),
  paper: (id: number) => get<PaperDetail>(`/paper/${id}`),
  entity: (name: string) => get<EntityResponse>(`/entity/${encodeURIComponent(name)}`),
  subgraph: (entities: string[]) => get<SubgraphResponse>(`/graph/subgraph?entities=${entities.map(encodeURIComponent).join(',')}`),
}

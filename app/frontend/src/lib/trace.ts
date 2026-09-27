// Turns the agent's SSE events into an ordered list of steps: free-text
// reasoning, and tool calls paired with their results.

export type TraceStep =
  | { id: string; kind: 'reasoning'; text: string }
  | { id: string; kind: 'tool'; tool: string; input: Record<string, unknown>; result?: string }

export type TraceEvent =
  | { type: 'reasoning'; text: string }
  | { type: 'tool_call'; tool: string; input?: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; summary: string }

export function applyTraceEvent(steps: TraceStep[], event: TraceEvent, nextId: () => string): TraceStep[] {
  switch (event.type) {
    case 'reasoning': {
      const last = steps[steps.length - 1]
      if (last?.kind === 'reasoning') {
        return [...steps.slice(0, -1), { ...last, text: last.text + event.text }]
      }
      return [...steps, { id: nextId(), kind: 'reasoning', text: event.text }]
    }
    case 'tool_call':
      return [...steps, { id: nextId(), kind: 'tool', tool: event.tool, input: event.input ?? {} }]
    case 'tool_result': {
      // Results arrive in call order, so attach to the earliest pending call of that tool.
      const idx = steps.findIndex(s => s.kind === 'tool' && s.tool === event.tool && s.result === undefined)
      if (idx === -1) return steps
      const next = steps.slice()
      next[idx] = { ...(steps[idx] as Extract<TraceStep, { kind: 'tool' }>), result: event.summary }
      return next
    }
  }
}

/** The tool currently running, if any — drives the live status label. */
export function pendingTool(steps: TraceStep[]): string | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]
    if (s.kind === 'tool' && s.result === undefined) return s.tool
  }
  return null
}

export const TOOL_LABELS: Record<string, { label: string; running: string }> = {
  hybrid_search:          { label: 'Hybrid search',       running: 'Searching papers…' },
  extract_query_entities: { label: 'Entity extraction',   running: 'Extracting entities…' },
  get_papers_by_entity:   { label: 'Papers by entity',    running: 'Finding papers for an entity…' },
  get_entity_connections: { label: 'Entity connections',  running: 'Walking entity connections…' },
  get_paper_details:      { label: 'Paper details',       running: 'Reading a paper…' },
}

export function toolLabel(tool: string): string {
  return TOOL_LABELS[tool]?.label ?? tool
}

export function toolRunningLabel(tool: string): string {
  return TOOL_LABELS[tool]?.running ?? `Running ${tool}…`
}

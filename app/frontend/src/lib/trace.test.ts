import { describe, expect, it } from 'vitest'
import { applyTraceEvent, pendingTool, type TraceEvent, type TraceStep } from './trace'

function run(events: TraceEvent[]): TraceStep[] {
  let n = 0
  return events.reduce<TraceStep[]>((steps, e) => applyTraceEvent(steps, e, () => `s${n++}`), [])
}

describe('applyTraceEvent', () => {
  it('merges consecutive reasoning deltas into one step', () => {
    const steps = run([
      { type: 'reasoning', text: 'Look' },
      { type: 'reasoning', text: 'ing up BRCA1' },
    ])
    expect(steps).toEqual([{ id: 's0', kind: 'reasoning', text: 'Looking up BRCA1' }])
  })

  it('pairs each tool result with its call', () => {
    const steps = run([
      { type: 'tool_call', tool: 'hybrid_search', input: { query: 'BRCA1' } },
      { type: 'tool_call', tool: 'get_paper_details', input: { paper_id: 3 } },
      { type: 'tool_result', tool: 'hybrid_search', summary: '[5 papers]' },
    ])
    expect(steps[0]).toMatchObject({ kind: 'tool', tool: 'hybrid_search', result: '[5 papers]' })
    expect(steps[1]).toMatchObject({ kind: 'tool', tool: 'get_paper_details' })
    expect(steps[1]).not.toHaveProperty('result')
    expect(pendingTool(steps)).toBe('get_paper_details')
  })

  it('attaches repeated calls of the same tool in order', () => {
    const steps = run([
      { type: 'tool_call', tool: 'hybrid_search', input: { query: 'a' } },
      { type: 'tool_call', tool: 'hybrid_search', input: { query: 'b' } },
      { type: 'tool_result', tool: 'hybrid_search', summary: 'first' },
      { type: 'tool_result', tool: 'hybrid_search', summary: 'second' },
    ])
    expect(steps.map(s => s.kind === 'tool' && s.result)).toEqual(['first', 'second'])
    expect(pendingTool(steps)).toBeNull()
  })

  it('ignores a result with no matching call', () => {
    expect(run([{ type: 'tool_result', tool: 'hybrid_search', summary: 'x' }])).toEqual([])
  })
})

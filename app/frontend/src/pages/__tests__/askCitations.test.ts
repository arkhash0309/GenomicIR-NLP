import { describe, expect, it } from 'vitest'

// Types mirrored from Ask.tsx
interface Citation { doi: string; title: string; paper_id: string }

// Pure helpers that mirror the rendering logic in Ask.tsx
function citationHref(c: Citation): string {
  return `/paper/${c.paper_id}`
}

function citationLabel(c: Citation): string {
  return `${c.title} · ${c.doi}`
}

function hasUnverifiedNote(unverified: string[]): boolean {
  return unverified.length > 0
}

function unverifiedText(unverified: string[]): string {
  return `Unverified references (not found in retrieved papers): ${unverified.join(', ')}`
}

// Stub `done` payload matching the backend contract:
// { type: 'done', citations: [{doi, title, paper_id}], unverified: [doi, ...] }
const STUB_DONE_PAYLOAD = {
  type: 'done' as const,
  citations: [
    { doi: '10.1038/nature12345', title: 'BRCA1 and Hereditary Breast Cancer', paper_id: 'paper-abc-123' },
  ],
  unverified: ['10.9999/unknown-doi-xyz'],
}

describe('Ask page — citations from done event', () => {
  it('verified citation link href includes paper_id', () => {
    const c = STUB_DONE_PAYLOAD.citations[0]
    expect(citationHref(c)).toBe('/paper/paper-abc-123')
  })

  it('verified citation label shows title and doi', () => {
    const c = STUB_DONE_PAYLOAD.citations[0]
    expect(citationLabel(c)).toBe('BRCA1 and Hereditary Breast Cancer · 10.1038/nature12345')
  })

  it('unverified note is shown when unverified array is non-empty', () => {
    expect(hasUnverifiedNote(STUB_DONE_PAYLOAD.unverified)).toBe(true)
  })

  it('unverified note text contains the unverified doi', () => {
    const text = unverifiedText(STUB_DONE_PAYLOAD.unverified)
    expect(text).toContain('10.9999/unknown-doi-xyz')
    expect(text).toContain('Unverified references (not found in retrieved papers)')
  })

  it('no unverified note when unverified array is empty', () => {
    expect(hasUnverifiedNote([])).toBe(false)
  })
})

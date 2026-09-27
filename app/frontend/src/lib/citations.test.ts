import { describe, expect, it } from 'vitest'
import { segmentAnswer, type Citation } from './citations'
import { bareDoi, doiUrl } from './doi'

const BRCA: Citation = {
  doi: 'https://doi.org/10.1101/2025.03.24.645116',
  title: 'BRCA1 and hereditary breast cancer',
  paper_id: 12,
}
const TP53: Citation = { doi: '10.1101/2024.11.02.621000', title: 'TP53 in tumour suppression', paper_id: 40 }

describe('doi helpers', () => {
  it('strips URL and doi: prefixes and trailing punctuation', () => {
    expect(bareDoi('https://doi.org/10.1101/2025.03.24.645116')).toBe('10.1101/2025.03.24.645116')
    expect(bareDoi('doi: 10.1101/2025.03.24.645116.')).toBe('10.1101/2025.03.24.645116')
  })

  it('never double-prefixes links', () => {
    expect(doiUrl('https://doi.org/10.1101/x')).toBe('https://doi.org/10.1101/x')
    expect(doiUrl('10.1101/x')).toBe('https://doi.org/10.1101/x')
  })
})

describe('segmentAnswer', () => {
  it('replaces verified DOIs (with dots) by numbered markers, in citation order', () => {
    const text = 'BRCA1 matters [Smith et al., 10.1101/2025.03.24.645116]. So does TP53 (10.1101/2024.11.02.621000).'
    const segs = segmentAnswer(text, [BRCA, TP53], [])
    expect(segs).toEqual([
      { kind: 'text', text: 'BRCA1 matters [Smith et al., ' },
      { kind: 'cite', n: 1, citation: BRCA },
      { kind: 'text', text: ']. So does TP53 (' },
      { kind: 'cite', n: 2, citation: TP53 },
      { kind: 'text', text: ').' },
    ])
  })

  it('keeps sentence punctuation after a DOI and swallows a URL prefix', () => {
    const segs = segmentAnswer('See https://doi.org/10.1101/2025.03.24.645116.', [BRCA], [])
    expect(segs).toEqual([
      { kind: 'text', text: 'See ' },
      { kind: 'cite', n: 1, citation: BRCA },
      { kind: 'text', text: '.' },
    ])
  })

  it('reuses the same number when a DOI is cited twice', () => {
    const segs = segmentAnswer('A 10.1101/2025.03.24.645116 B 10.1101/2025.03.24.645116', [BRCA], [])
    const cites = segs.filter(s => s.kind === 'cite')
    expect(cites.map(c => c.kind === 'cite' && c.n)).toEqual([1, 1])
  })

  it('marks unverified DOIs and leaves unknown DOI-looking text alone', () => {
    const segs = segmentAnswer('X 10.9999/made.up and 10.5555/other', [], ['10.9999/made.up'])
    expect(segs).toEqual([
      { kind: 'text', text: 'X ' },
      { kind: 'unverified', doi: '10.9999/made.up' },
      { kind: 'text', text: ' and 10.5555/other' },
    ])
  })

  it('returns the text untouched while citations are not yet known', () => {
    expect(segmentAnswer('streaming 10.1101/2025.03.24.645116', [], [])).toEqual([
      { kind: 'text', text: 'streaming 10.1101/2025.03.24.645116' },
    ])
  })
})

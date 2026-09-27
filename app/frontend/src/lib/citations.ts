import { DOI_IN_TEXT, bareDoi, doiKey } from './doi'

export interface Citation { doi: string; title: string; paper_id: string | number }

export type AnswerSegment =
  | { kind: 'text'; text: string }
  | { kind: 'cite'; n: number; citation: Citation }
  | { kind: 'unverified'; doi: string }

/**
 * Split answer text into plain text and citation markers. Verified DOIs are
 * numbered in the order the backend returned them (which is first-mention
 * order), so marker [n] lines up with source n in the list below the answer.
 * DOIs the backend flagged as unverified become their own marker kind.
 */
export function segmentAnswer(text: string, citations: Citation[], unverified: string[]): AnswerSegment[] {
  const numbered = new Map(citations.map((c, i) => [doiKey(c.doi), { n: i + 1, citation: c }]))
  const flagged = new Set(unverified.map(doiKey))
  const segments: AnswerSegment[] = []
  let last = 0

  for (const match of text.matchAll(DOI_IN_TEXT)) {
    const raw = match[0]
    const key = doiKey(raw)
    const hit = numbered.get(key)
    if (!hit && !flagged.has(key)) continue

    const start = match.index ?? 0
    // Swallow a "https://doi.org/" or "doi:" prefix the model wrote before the DOI.
    const before = text.slice(last, start).replace(/(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)$/i, '')
    if (before) segments.push({ kind: 'text', text: before })
    segments.push(hit ? { kind: 'cite', ...hit } : { kind: 'unverified', doi: bareDoi(raw) })

    // Keep sentence punctuation that the DOI regex grabbed, e.g. "…645116."
    const trailing = raw.slice(bareDoi(raw).length)
    last = start + raw.length - trailing.length
  }

  const rest = text.slice(last)
  if (rest) segments.push({ kind: 'text', text: rest })
  return segments
}

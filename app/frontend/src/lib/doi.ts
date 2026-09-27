// The corpus stores DOIs as full URLs ("https://doi.org/10.1101/2025.03.24.645116"),
// while the model writes them bare. Normalise both sides before comparing or linking.

const DOI_PREFIX = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i

/** Matches a DOI in free text. Kept in sync with `_DOI_RE` in app/backend/src/agent.py. */
export const DOI_IN_TEXT = /10\.\d{4,9}\/[^\s\][()<>{},;"']+/g

/** "https://doi.org/10.1101/X." → "10.1101/X" (trailing sentence punctuation dropped). */
export function bareDoi(doi: string): string {
  return doi.trim().replace(DOI_PREFIX, '').replace(/[.:]+$/, '')
}

/** Case-insensitive key for matching DOIs (DOIs are case-insensitive by spec). */
export function doiKey(doi: string): string {
  return bareDoi(doi).toLowerCase()
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${bareDoi(doi)}`
}

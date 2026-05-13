import { splitSentences, tokenize } from "./textUtils";

// Extractive summarizer: score sentences by sum of term frequencies of their
// non-stopword tokens, return top-N in original order.
export function summarize(text: string, maxSentences = 3): string {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(" ");

  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const t of tokenize(s)) freq.set(t, (freq.get(t) || 0) + 1);
  }

  const scored = sentences.map((s, idx) => {
    const tokens = tokenize(s);
    if (!tokens.length) return { idx, score: 0 };
    const score = tokens.reduce((sum, t) => sum + (freq.get(t) || 0), 0) / tokens.length;
    return { idx, score };
  });

  const chosen = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .map(x => x.idx)
    .sort((a, b) => a - b);

  return chosen.map(i => sentences[i]).join(" ");
}

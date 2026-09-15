import { search } from "./retrieval";
import { splitSentences, tokenize } from "./textUtils";
import type { Paper } from "./dataStore";

export interface QAAnswer {
  answer: string;
  sources: { title: string; url: string; doi: string; snippet: string }[];
}

// Retrieval-augmented extractive QA:
// 1. Retrieve top papers for the question
// 2. From their abstracts, find the sentences with highest token overlap with the question
// 3. Compose an answer from the best 2-3 sentences across the top papers
export function answerQuestion(question: string): QAAnswer {
  const hits = search(question, 5);
  if (!hits.length) {
    return {
      answer:
        "I couldn't find any indexed genomics papers that match your question. Try rephrasing or using more specific terminology.",
      sources: [],
    };
  }

  const qTokens = new Set(tokenize(question));

  const candidateSentences: { sentence: string; score: number; paper: Paper }[] = [];
  for (const { paper } of hits) {
    const sentences = splitSentences(paper.abstract);
    for (const s of sentences) {
      const tokens = tokenize(s);
      if (!tokens.length) continue;
      let overlap = 0;
      for (const t of tokens) if (qTokens.has(t)) overlap++;
      const score = overlap / Math.sqrt(tokens.length);
      if (score > 0) candidateSentences.push({ sentence: s, score, paper });
    }
  }

  const top = candidateSentences.sort((a, b) => b.score - a.score).slice(0, 3);

  let answer: string;
  if (!top.length) {
    answer =
      "I found related papers but couldn't extract a direct answer. The most relevant paper is \"" +
      hits[0].paper.title + "\". You may want to skim its abstract.";
  } else {
    answer = top.map(t => t.sentence).join(" ");
  }

  const seen = new Set<string>();
  const sources = (top.length ? top.map(t => t.paper) : hits.map(h => h.paper))
    .filter(p => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    })
    .slice(0, 4)
    .map(p => ({
      title: p.title,
      url: p.url,
      doi: p.doi,
      snippet: p.summary || splitSentences(p.abstract).slice(0, 1).join(" "),
    }));

  return { answer, sources };
}

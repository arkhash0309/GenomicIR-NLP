import { getPapers, Paper } from "./dataStore";
import { tokenize } from "./textUtils";

interface IndexState {
  df: Map<string, number>;
  docTokens: string[][];
  docTF: Map<string, number>[];
  docLen: number[];
  avgLen: number;
  N: number;
}

let index: IndexState | null = null;

function buildIndex(): IndexState {
  if (index) return index;
  const papers = getPapers();
  const docTokens: string[][] = [];
  const docTF: Map<string, number>[] = [];
  const docLen: number[] = [];
  const df = new Map<string, number>();

  for (const p of papers) {
    const tokens = tokenize(p.title + " " + p.abstract);
    docTokens.push(tokens);
    docLen.push(tokens.length);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    docTF.push(tf);
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const avgLen = docLen.reduce((a, b) => a + b, 0) / Math.max(docLen.length, 1);
  index = { df, docTokens, docTF, docLen, avgLen, N: papers.length };
  return index;
}

// BM25
export function search(query: string, topK = 5): { paper: Paper; score: number }[] {
  const idx = buildIndex();
  const papers = getPapers();
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const k1 = 1.5, b = 0.75;
  const scores = new Float64Array(idx.N);

  for (const term of new Set(qTokens)) {
    const df = idx.df.get(term);
    if (!df) continue;
    const idf = Math.log(1 + (idx.N - df + 0.5) / (df + 0.5));
    for (let i = 0; i < idx.N; i++) {
      const tf = idx.docTF[i].get(term);
      if (!tf) continue;
      const norm = tf * (k1 + 1) / (tf + k1 * (1 - b + b * (idx.docLen[i] / idx.avgLen)));
      scores[i] += idf * norm;
    }
  }

  const ranked = Array.from(scores)
    .map((score, i) => ({ score, i }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked.map(r => ({ paper: papers[r.i], score: r.score }));
}

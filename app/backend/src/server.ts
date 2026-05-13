import Fastify from "fastify";
import cors from "@fastify/cors";
import { getPapers, getPaperById, loadPapers } from "./services/dataStore";
import { search } from "./services/retrieval";
import { summarize } from "./services/summarizer";
import { answerQuestion } from "./services/qa";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.get("/api/health", async () => ({
    status: "ok",
    papers: getPapers().length,
  }));

  app.get("/api/stats", async () => {
    const papers = getPapers();
    return {
      paperCount: papers.length,
      avgAbstractWords: Math.round(
        papers.reduce((s, p) => s + p.abstract.split(/\s+/).length, 0) /
          Math.max(papers.length, 1)
      ),
      withSummary: papers.filter(p => p.summary).length,
    };
  });

  app.get<{ Querystring: { q?: string; k?: string } }>(
    "/api/retrieve",
    async req => {
      const q = (req.query.q || "").toString();
      const k = Math.min(Math.max(parseInt(req.query.k || "5", 10) || 5, 1), 20);
      if (!q.trim()) return { query: q, results: [] };
      const results = search(q, k).map(({ paper, score }) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        doi: paper.doi,
        date: paper.date,
        url: paper.url,
        summary: paper.summary,
        abstract: paper.abstract,
        score: Number(score.toFixed(4)),
      }));
      return { query: q, results };
    }
  );

  app.post<{ Body: { text?: string; paperId?: number; sentences?: number } }>(
    "/api/summarize",
    async (req, reply) => {
      const { text, paperId, sentences } = req.body || {};
      const n = Math.min(Math.max(sentences ?? 3, 1), 8);
      let source = text || "";
      let paperMeta: any = null;
      if (!source && typeof paperId === "number") {
        const p = getPaperById(paperId);
        if (!p) return reply.code(404).send({ error: "paper not found" });
        source = p.abstract;
        paperMeta = { title: p.title, url: p.url, doi: p.doi };
      }
      if (!source.trim()) {
        return reply.code(400).send({ error: "provide text or paperId" });
      }
      return {
        summary: summarize(source, n),
        existingSummary: paperMeta ? getPaperById(paperId!)?.summary : null,
        paper: paperMeta,
      };
    }
  );

  app.post<{ Body: { question?: string } }>("/api/qa", async (req, reply) => {
    const q = (req.body?.question || "").toString();
    if (!q.trim()) return reply.code(400).send({ error: "question required" });
    return { question: q, ...answerQuestion(q) };
  });

  app.get<{ Params: { id: string } }>("/api/paper/:id", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    const p = getPaperById(id);
    if (!p) return reply.code(404).send({ error: "not found" });
    return p;
  });

  app.log.info("Loading paper index...");
  loadPapers();
  app.log.info(`Loaded ${getPapers().length} papers.`);

  await app.listen({ port: PORT, host: HOST });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

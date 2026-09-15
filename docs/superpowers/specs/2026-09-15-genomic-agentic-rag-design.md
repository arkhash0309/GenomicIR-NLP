# GenomicIR-NLP — Agentic RAG Redesign
**Date:** 2026-09-15  
**Author:** Aadhavan Arkhash Saravanakumar  
**Status:** Approved

---

## 1. Goal

Transform the GenomicIR-NLP project into a production-grade, portfolio-quality application that demonstrates:
- Agentic LLM systems (Claude tool use + streaming)
- Hybrid information retrieval (semantic + lexical + reranking)
- Biomedical knowledge graph construction and traversal
- Modern full-stack engineering (React + FastAPI)

Primary audience: recruiters and engineers at top tech and bioinformatics companies (Anthropic, Google DeepMind, Recursion, Illumina, 10x Genomics, etc.).

---

## 2. Architecture Overview

```
React 18 + Vite + TailwindCSS  (port 5173)
              │  REST + SSE streaming
              ▼
      FastAPI + Uvicorn          (port 8000)
              │
       ┌──────┴────────┐
       │  Agent Layer  │  ← Claude claude-sonnet-4-6 (tool use + streaming)
       └──────┬────────┘
              │ tool calls
   ┌──────────┴────────────────────────────┐
   │         Intelligence Layer            │
   │  ┌─────────────┐  ┌────────────────┐  │
   │  │ Hybrid      │  │ Knowledge      │  │
   │  │ Search      │  │ Graph          │  │
   │  │ FAISS+BM25  │  │ NetworkX       │  │
   │  │ RRF+rerank  │  │ entities+edges │  │
   │  └─────────────┘  └────────────────┘  │
   └───────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │  Data Layer │  papers.csv + FAISS index + scispaCy NER cache
       └─────────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + Vite + TailwindCSS | Modern, fast HMR, utility-first styling |
| Graph viz | D3.js force simulation | Fine-grained control over live graph animation |
| Animations | Framer Motion | Polished page transitions and micro-interactions |
| Backend | Python 3.11 + FastAPI | Native ML ecosystem; async SSE streaming |
| Semantic search | FAISS + `all-MiniLM-L6-v2` | Reuse existing index; proven embeddings |
| Lexical search | `rank_bm25` | Lightweight, no deps |
| Score fusion | Reciprocal Rank Fusion (RRF) | Parameter-free, principled combination |
| Reranking | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Top-5 precision lift with cross-attention |
| NER | scispaCy `en_ner_bc5cdr_md` | Biomedical entities: genes, diseases, chemicals |
| Knowledge graph | NetworkX (in-memory) | 7,070 papers fit comfortably in RAM |
| LLM | Anthropic `claude-sonnet-4-6` | Tool use, streaming, citations |

---

## 4. Data Layer

**Source:** `5_INFORMATION_RETRIEVAL/data/papers_combined_with_abstract_and_summary.csv`  
**Records:** ~7,070 bioRxiv genomics papers  
**Fields used:** Title, Authors, DOI, Date, Paper URL, Abstract, Summary

**Startup sequence (once, ~30–60s):**
1. Load CSV → list of `Paper` Pydantic models
2. Load FAISS index from `5_INFORMATION_RETRIEVAL/embeddings/papers_index.faiss`
3. Load `all-MiniLM-L6-v2` via sentence-transformers
4. Build `rank_bm25` BM25Okapi index over `title + abstract` tokens
5. Run scispaCy `en_ner_bc5cdr_md` over every abstract → per-paper entity cache (persisted to `backend/data/entity_cache.json` so it only runs once)
6. Build NetworkX directed graph:
   - Nodes: `Paper` (type=paper) + unique entities (type=gene|disease|chemical)
   - Edges: `Paper → Entity` ("mentions"), `Entity → Entity` ("co_occurs_with", weight = shared paper count)

---

## 5. Intelligence Layer

### 5.1 Hybrid Search

```
query
  ├─► FAISS top-20  (cosine similarity, all-MiniLM-L6-v2)
  ├─► BM25 top-20   (BM25Okapi over title+abstract)
  ├─► RRF fusion    (k=60, produces unified ranked list)
  └─► Cross-encoder rerank top-10 → return top-k
```

RRF score: `sum(1 / (k + rank_i))` for each retrieval system.  
Cross-encoder: `cross-encoder/ms-marco-MiniLM-L-6-v2` scores `(query, abstract)` pairs.

### 5.2 Knowledge Graph

**Nodes:**
- `Paper`: id, title, doi, url, date, abstract snippet
- `Entity`: name, type (Gene | Disease | Chemical | Organism)

**Edges:**
- `(Paper) -[MENTIONS]→ (Entity)`: paper contains this entity
- `(Entity) -[CO_OCCURS_WITH]→ (Entity)`: weight = number of shared papers

**Queries supported:**
- Papers mentioning entity X
- Entities co-occurring with entity X, ranked by weight
- Shortest path between two entities (NetworkX `shortest_path`)

### 5.3 Claude Agent Tools

Five tools exposed to Claude via Anthropic tool use API:

| Tool | Signature | Returns |
|---|---|---|
| `hybrid_search` | `(query: str, k: int = 5)` | List of ranked papers with scores |
| `get_papers_by_entity` | `(name: str, entity_type: str)` | Papers mentioning this entity |
| `get_entity_connections` | `(entity: str)` | Related entities + co-occurrence counts |
| `get_paper_details` | `(paper_id: int)` | Full paper record + entity list |
| `extract_query_entities` | `(query: str)` | Biomedical entities found in the question |

### 5.4 Agent Flow

1. Receive user question
2. Claude calls `extract_query_entities` to seed graph traversal
3. Claude calls `hybrid_search` for broad retrieval
4. If entities found, Claude calls `get_entity_connections` to expand via KG
5. Claude calls `get_paper_details` on most relevant results
6. Claude streams final grounded answer with inline `[DOI]` citations
7. All tool call inputs/outputs are streamed to frontend as SSE events

---

## 6. Backend API

**Base:** `http://localhost:8000`

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status + corpus stats |
| GET | `/stats` | Paper count, entity count, graph edge count |
| GET | `/search?q=&k=` | Hybrid search, returns ranked papers |
| GET | `/paper/{id}` | Single paper + entity list |
| GET | `/entity/{name}` | Entity node + connected papers |
| GET | `/graph/subgraph?entities=` | Subgraph for given entities (for Graph Explorer) |
| POST | `/ask` | SSE stream: agent reasoning + answer |
| GET | `/graph/stats` | KG node/edge counts by type |

**`/ask` SSE event types:**
```
event: tool_call      { tool, input }
event: tool_result    { tool, output_summary }
event: reasoning      { text }          ← Claude thinking token stream
event: answer         { text }          ← final answer token stream
event: graph_update   { nodes[], edges[] }  ← incremental graph data
event: done           { citations[] }
```

---

## 7. Frontend

### 7.1 Pages

| Route | Page | Key elements |
|---|---|---|
| `/` | Home | Hero, animated DNA particles, corpus stats counters |
| `/ask` | Research Assistant | Agent reasoning panel + live D3 graph + answer |
| `/search` | Search | Hybrid search results with entity chips + scores |
| `/explore` | Graph Explorer | Full KG browser, filter by type, click-to-explore |
| `/paper/:id` | Paper Detail | Full paper, entity tags, "Ask about this" button |

### 7.2 Research Assistant Layout

```
┌─────────────────────────────────────────────────────┐
│  [Question input + Submit]                          │
├───────────────────────┬─────────────────────────────┤
│  Agent Reasoning      │  Knowledge Graph             │
│  (monospace stream)   │  (D3 force-directed)         │
│                       │  Papers = blue circles       │
│  > extract_query_...  │  Genes = green               │
│  > hybrid_search(...)│  Diseases = red              │
│  > get_entity_conn.. │  Chemicals = amber           │
│  > ...                │  (nodes pulse in live)       │
├───────────────────────┴─────────────────────────────┤
│  Answer (streams in) with [DOI] citation chips      │
└─────────────────────────────────────────────────────┘
```

### 7.3 Visual Language

- **Background:** `#0a0f1e` (deep navy)
- **Accents:** cyan `#06b6d4` (primary), emerald `#10b981` (genes), rose `#f43f5e` (diseases), amber `#f59e0b` (chemicals)
- **Panels:** glassmorphism (`backdrop-blur`, `bg-white/5`, `border-white/10`)
- **Typography:** Inter (UI) + JetBrains Mono (reasoning trace)
- **Animations:** Framer Motion page transitions; D3 node enter with radial pulse

### 7.4 D3 Graph Behaviour

- Force simulation: charge repulsion + link distance + center gravity
- Nodes enter with a radial pulse animation keyed on `graph_update` SSE events
- Node click → side panel showing paper list or entity connections
- Zoom + pan enabled
- Node labels appear on hover to avoid clutter at scale

---

## 8. Repository Structure (target)

```
GenomicIR-NLP/
├── 1_WEB_SCRAPING/        (unchanged)
├── 2_DATA_STORE/          (unchanged)
├── 3_SUMMARIZATION_MODEL/ (unchanged)
├── 4_QA_BOT/              (unchanged)
├── 5_INFORMATION_RETRIEVAL/ (unchanged — data/embeddings reused)
├── app/
│   ├── backend/           (replace: Python FastAPI)
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── data/
│   │   │   └── entity_cache.json   (generated at first startup)
│   │   └── src/
│   │       ├── models.py           (Pydantic schemas)
│   │       ├── data_store.py       (paper loading)
│   │       ├── search.py           (FAISS + BM25 + RRF + rerank)
│   │       ├── graph.py            (NetworkX KG build + query)
│   │       ├── ner.py              (scispaCy entity extraction)
│   │       ├── agent.py            (Claude tool use + SSE streaming)
│   │       └── routers/
│   │           ├── search.py
│   │           ├── paper.py
│   │           ├── graph.py
│   │           └── ask.py
│   └── frontend/          (replace: React + Vite + Tailwind)
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── pages/
│           │   ├── Home.tsx
│           │   ├── Ask.tsx
│           │   ├── Search.tsx
│           │   ├── GraphExplorer.tsx
│           │   └── PaperDetail.tsx
│           ├── components/
│           │   ├── KnowledgeGraph.tsx   (D3 wrapper)
│           │   ├── ReasoningTrace.tsx
│           │   ├── AnswerCard.tsx
│           │   ├── PaperCard.tsx
│           │   ├── EntityChip.tsx
│           │   └── SearchBar.tsx
│           ├── hooks/
│           │   ├── useSSE.ts
│           │   └── useGraph.ts
│           └── lib/
│               └── api.ts
├── docs/
│   └── superpowers/specs/
│       └── 2026-09-15-genomic-agentic-rag-design.md
└── README.md
```

---

## 9. Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
BACKEND_URL=http://localhost:8000        # frontend reads this
PORT=8000
```

---

## 10. Non-Goals

- User authentication / accounts
- Paper ingestion UI (corpus is fixed at 7,070 papers)
- Mobile-responsive layout (desktop showcase is sufficient)
- Deployment to cloud (local + README instructions are enough for portfolio)

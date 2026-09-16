# GenomicIR-NLP

A portfolio-grade agentic RAG application over 7,070 bioRxiv genomics papers.

## What it does

- **Research Assistant** (`/ask`): Claude agent with tool use — hybrid search, entity extraction, knowledge graph traversal. Streams reasoning trace and builds a live D3 force-directed graph as it thinks.
- **Hybrid Search** (`/search`): FAISS semantic + BM25 lexical + RRF fusion + cross-encoder reranking.
- **Graph Explorer** (`/explore`): Browse entity co-occurrence network — genes, diseases, chemicals and their paper connections.
- **Paper Detail** (`/paper/:id`): Full paper with extracted biomedical entities.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + D3.js + Framer Motion |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| LLM | Anthropic Claude claude-sonnet-4-6 (tool use + SSE streaming) |
| Retrieval | FAISS + rank-bm25 + RRF + cross-encoder/ms-marco-MiniLM-L-6-v2 |
| NER | scispaCy en_ner_bc5cdr_md + en_ner_jnlpba_md |
| Knowledge graph | NetworkX (in-memory, built at startup) |

## Running locally

### Prerequisites
- Python 3.11+, Node 18+
- Anthropic API key

### Backend

```bash
cd app/backend
pip install -r requirements.txt
cp .env.example .env          # add your ANTHROPIC_API_KEY
python main.py                # http://localhost:8000 — startup takes ~60s
```

### Frontend

```bash
cd app/frontend
npm install
npm run dev                   # http://localhost:5173
```

## Data

All source data is in `notebooks/5_INFORMATION_RETRIEVAL/data/`. The backend reads it directly — no copy needed.
The entity cache (`app/backend/data/entity_cache.json`) is generated on first startup (~5 min) and reused on subsequent starts.

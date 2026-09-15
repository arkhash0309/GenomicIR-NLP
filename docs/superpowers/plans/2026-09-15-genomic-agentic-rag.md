# GenomicIR-NLP Agentic RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild GenomicIR-NLP as a portfolio-grade agentic RAG application with a React/Tailwind frontend, FastAPI backend, hybrid search, scispaCy NER, NetworkX knowledge graph, and a Claude tool-use agent that streams live reasoning and a D3 knowledge graph.

**Architecture:** React 18 + Vite frontend talks to FastAPI backend over REST + SSE. The backend exposes a `/ask` streaming endpoint where Claude uses 5 tools (hybrid search, entity lookup, graph traversal, paper detail, NER) to answer questions, streaming reasoning tokens and incremental graph updates to the browser in real time.

**Tech Stack:** Python 3.11, FastAPI, Anthropic SDK (async), sentence-transformers, FAISS, rank-bm25, scispaCy (en_ner_bc5cdr_md + en_ner_jnlpba_md), NetworkX, React 18, Vite, TailwindCSS v3, D3.js v7, Framer Motion, React Router v6.

## Global Constraints

- Python 3.11+; Node 18+
- All paths relative to repo root `GenomicIR-NLP/`
- Data source: `5_INFORMATION_RETRIEVAL/data/metadata.pkl` (FAISS row order), `5_INFORMATION_RETRIEVAL/data/papers_combined_with_abstract_and_summary.csv` (Summary enrichment), `5_INFORMATION_RETRIEVAL/embeddings/papers_index.faiss`
- FAISS index uses L2 distance; paper ID = FAISS position = `df.iloc[i]` row index after `reset_index(drop=True)`
- LLM: `claude-sonnet-4-6` via `AsyncAnthropic`
- `ANTHROPIC_API_KEY` in `app/backend/.env`
- Backend port: 8000; Frontend port: 5173
- Entity types: `Disease`, `Chemical` (bc5cdr), `Gene` (jnlpba: DNA/RNA/PROTEIN mapped → Gene)
- Node colors: paper=#3b82f6, Gene=#10b981, Disease=#f43f5e, Chemical=#f59e0b
- Visual theme: bg `#0a0f1e`, accent cyan `#06b6d4`, glassmorphism panels

---

## File Map

```
app/
├── backend/                          ← replace entire dir
│   ├── main.py                       # FastAPI app + lifespan startup
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/entity_cache.json        # generated at startup, gitignored
│   └── src/
│       ├── __init__.py
│       ├── models.py                 # Pydantic schemas
│       ├── data_store.py             # load metadata.pkl + CSV → Paper list
│       ├── search.py                 # FAISS + BM25 + RRF + cross-encoder
│       ├── ner.py                    # scispaCy NER + cache
│       ├── graph.py                  # NetworkX KG build + query
│       ├── agent.py                  # Claude tool use + SSE generator
│       └── routers/
│           ├── __init__.py
│           ├── health.py             # GET /health, GET /stats
│           ├── search.py             # GET /search
│           ├── paper.py              # GET /paper/{id}
│           ├── graph_routes.py       # GET /entity/{name}, /graph/subgraph, /graph/stats
│           └── ask.py                # POST /ask  (SSE)
└── frontend/                         ← replace entire dir
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx                   # Router + layout shell
        ├── lib/api.ts                # typed fetch wrappers
        ├── hooks/
        │   ├── useSSE.ts             # fetch-based SSE for POST endpoints
        │   └── useGraph.ts           # accumulate incremental graph_update events
        ├── components/
        │   ├── Nav.tsx
        │   ├── KnowledgeGraph.tsx    # D3 force-directed graph (SVG ref)
        │   ├── ReasoningTrace.tsx    # streaming terminal panel
        │   ├── AnswerCard.tsx        # final answer + citation chips
        │   ├── PaperCard.tsx
        │   ├── EntityChip.tsx
        │   └── SearchBar.tsx
        └── pages/
            ├── Home.tsx
            ├── Ask.tsx               # showpiece: reasoning + graph + answer
            ├── Search.tsx
            ├── GraphExplorer.tsx
            └── PaperDetail.tsx
```

---

### Task 1: Delete old code + backend scaffold + data store

**Files:**
- Delete: `app/backend/` (entire TypeScript dir)
- Delete: `app/frontend/` (entire Flask dir)
- Create: `app/backend/requirements.txt`
- Create: `app/backend/.env.example`
- Create: `app/backend/src/__init__.py`
- Create: `app/backend/src/models.py`
- Create: `app/backend/src/data_store.py`
- Create: `app/backend/tests/__init__.py`
- Create: `app/backend/tests/conftest.py`
- Create: `app/backend/tests/test_data_store.py`

**Interfaces:**
- Produces: `Paper`, `Entity`, `SearchResult`, `SubgraphResponse`, `GraphNode`, `GraphEdge` Pydantic models; `load_papers() -> list[Paper]`, `get_papers() -> list[Paper]`, `get_paper_by_id(id: int) -> Paper | None`

- [ ] **Step 1: Delete old dirs and scaffold**

```powershell
Remove-Item -Recurse -Force app\backend
Remove-Item -Recurse -Force app\frontend
New-Item -ItemType Directory -Force app\backend\src\routers
New-Item -ItemType Directory -Force app\backend\tests
New-Item -ItemType Directory -Force app\backend\data
New-Item -ItemType File app\backend\src\__init__.py
New-Item -ItemType File app\backend\src\routers\__init__.py
New-Item -ItemType File app\backend\tests\__init__.py
New-Item -ItemType File app\backend\data\.gitkeep
```

- [ ] **Step 2: Write requirements.txt**

```
# app/backend/requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.30.1
python-dotenv==1.0.1
pydantic==2.7.1
anthropic==0.28.0
sentence-transformers==3.0.1
faiss-cpu==1.8.0
rank-bm25==0.2.2
scikit-learn==1.5.0
networkx==3.3
spacy==3.7.4
scispacy==0.5.4
pandas==2.2.2
numpy==1.26.4
pytest==8.2.2
pytest-asyncio==0.23.7
httpx==0.27.0
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_jnlpba_md-0.5.4.tar.gz
```

- [ ] **Step 3: Write `.env.example`**

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=8000
```

- [ ] **Step 4: Write failing test**

```python
# app/backend/tests/test_data_store.py
import pytest
from src.models import Paper

def test_paper_model_validates():
    p = Paper(id=0, title="Test", authors="A", doi="10.0/x", date="2023", url="http://x", abstract="abs", summary="sum")
    assert p.id == 0
    assert p.title == "Test"

def test_load_papers_returns_nonempty_list(loaded_papers):
    assert len(loaded_papers) > 100

def test_paper_has_required_fields(loaded_papers):
    p = loaded_papers[0]
    assert p.title
    assert p.abstract
    assert isinstance(p.id, int)

def test_get_paper_by_id(loaded_papers):
    from src.data_store import get_paper_by_id
    p = get_paper_by_id(0)
    assert p is not None
    assert p.id == 0

def test_get_paper_by_id_out_of_range(loaded_papers):
    from src.data_store import get_paper_by_id
    assert get_paper_by_id(999999) is None
```

- [ ] **Step 5: Write conftest.py**

```python
# app/backend/tests/conftest.py
import pytest
from src.models import Paper
from src.data_store import load_papers, _reset_papers

@pytest.fixture(scope="session")
def loaded_papers():
    return load_papers()

@pytest.fixture
def mock_papers():
    return [
        Paper(id=0, title="BRCA1 mutations in breast cancer", authors="Smith J",
              doi="10.1000/test.001", date="2023-01", url="https://example.com/1",
              abstract="BRCA1 is a tumor suppressor gene associated with hereditary breast and ovarian cancer. Mutations in BRCA1 increase cancer risk significantly.",
              summary="BRCA1 mutations increase cancer risk."),
        Paper(id=1, title="CRISPR-Cas9 genome editing in human cells", authors="Jones A",
              doi="10.1000/test.002", date="2023-02", url="https://example.com/2",
              abstract="CRISPR-Cas9 enables precise genome editing in human cells. This technology has revolutionized genetic research and therapy development.",
              summary="CRISPR enables genome editing."),
        Paper(id=2, title="RNA sequencing reveals gene expression patterns", authors="Lee B",
              doi="10.1000/test.003", date="2023-03", url="https://example.com/3",
              abstract="RNA sequencing analysis reveals complex gene expression patterns in cancer cells. Differential expression of key genes including TP53 affects treatment outcomes.",
              summary="RNA-seq reveals cancer gene expression."),
    ]
```

- [ ] **Step 6: Write models.py**

```python
# app/backend/src/models.py
from pydantic import BaseModel
from typing import Literal, Optional

class Paper(BaseModel):
    id: int
    title: str
    authors: str
    doi: str
    date: str
    url: str
    abstract: str
    summary: str

class Entity(BaseModel):
    name: str
    type: Literal["Gene", "Disease", "Chemical"]

class SearchResult(BaseModel):
    paper: Paper
    score: float
    rank: int

class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["paper", "Gene", "Disease", "Chemical"]

class GraphEdge(BaseModel):
    source: str
    target: str
    type: Literal["mentions", "co_occurs_with"]
    weight: float = 1.0

class SubgraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
```

- [ ] **Step 7: Write data_store.py**

```python
# app/backend/src/data_store.py
import pickle
from pathlib import Path
import pandas as pd
from .models import Paper

_REPO_ROOT = Path(__file__).resolve().parents[4]
_META = _REPO_ROOT / "5_INFORMATION_RETRIEVAL" / "data" / "metadata.pkl"
_CSV  = _REPO_ROOT / "5_INFORMATION_RETRIEVAL" / "data" / "papers_combined_with_abstract_and_summary.csv"

_papers: list[Paper] = []

def _reset_papers():
    global _papers
    _papers = []

def load_papers() -> list[Paper]:
    global _papers
    if _papers:
        return _papers
    df = pd.read_pickle(_META).reset_index(drop=True)
    csv_df = pd.read_csv(_CSV)
    summary_map: dict[str, str] = dict(
        zip(csv_df["Title"].str.strip(), csv_df["Summary"].fillna(""))
    )
    papers = []
    for i, row in df.iterrows():
        title = str(row.get("Title", "")).strip()
        papers.append(Paper(
            id=int(i),
            title=title,
            authors=str(row.get("Authors", "")).strip(),
            doi=str(row.get("DOI", "")).strip(),
            date=str(row.get("Date", "")).strip(),
            url=str(row.get("Paper URL", "")).strip(),
            abstract=str(row.get("Abstract", "")).strip(),
            summary=summary_map.get(title, ""),
        ))
    _papers = [p for p in papers if p.title and p.abstract]
    return _papers

def get_papers() -> list[Paper]:
    return _papers

def get_paper_by_id(paper_id: int) -> Paper | None:
    if 0 <= paper_id < len(_papers):
        return _papers[paper_id]
    return None
```

- [ ] **Step 8: Run tests**

```powershell
cd app\backend
pip install -r requirements.txt
pytest tests/test_data_store.py -v
```

Expected: 5 PASS

- [ ] **Step 9: Commit**

```bash
git add app/backend/
git commit -m "feat: add FastAPI backend scaffold, Pydantic models, and data store"
```

---

### Task 2: Hybrid search (FAISS + BM25 + RRF + cross-encoder)

**Files:**
- Create: `app/backend/src/search.py`
- Create: `app/backend/tests/test_search.py`

**Interfaces:**
- Consumes: `get_papers() -> list[Paper]` from `data_store`; `Paper` from `models`
- Produces: `load_search_indexes() -> None`, `hybrid_search(query: str, top_k: int = 5) -> list[SearchResult]`

- [ ] **Step 1: Write failing test**

```python
# app/backend/tests/test_search.py
import pytest
from src.search import hybrid_search, load_search_indexes
from src.data_store import load_papers

@pytest.fixture(scope="module", autouse=True)
def setup_search():
    load_papers()
    load_search_indexes()

def test_hybrid_search_returns_results():
    results = hybrid_search("CRISPR genome editing", top_k=5)
    assert len(results) == 5

def test_hybrid_search_results_have_scores():
    results = hybrid_search("gene expression cancer", top_k=3)
    for r in results:
        assert isinstance(r.score, float)
        assert r.paper.title

def test_hybrid_search_ranks_are_sequential():
    results = hybrid_search("RNA sequencing", top_k=4)
    assert [r.rank for r in results] == list(range(4))

def test_hybrid_search_empty_query_returns_empty():
    results = hybrid_search("", top_k=5)
    assert results == []
```

- [ ] **Step 2: Write search.py**

```python
# app/backend/src/search.py
from pathlib import Path
import numpy as np
import faiss
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder
from .models import SearchResult
from .data_store import get_papers

_REPO_ROOT = Path(__file__).resolve().parents[4]
_FAISS_PATH = _REPO_ROOT / "5_INFORMATION_RETRIEVAL" / "embeddings" / "papers_index.faiss"
_EMBED_MODEL = "all-MiniLM-L6-v2"
_RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_RRF_K = 60

_embedder: SentenceTransformer | None = None
_reranker: CrossEncoder | None = None
_faiss_index: faiss.Index | None = None
_bm25: BM25Okapi | None = None

def _tokenize(text: str) -> list[str]:
    return text.lower().split()

def load_search_indexes() -> None:
    global _embedder, _reranker, _faiss_index, _bm25
    papers = get_papers()
    _embedder = SentenceTransformer(_EMBED_MODEL)
    _reranker = CrossEncoder(_RERANK_MODEL)
    _faiss_index = faiss.read_index(str(_FAISS_PATH))
    corpus = [p.title + " " + p.abstract for p in papers]
    _bm25 = BM25Okapi([_tokenize(doc) for doc in corpus])

def _rrf(faiss_ids: list[int], bm25_ids: list[int], k: int = _RRF_K) -> list[tuple[int, float]]:
    scores: dict[int, float] = {}
    for rank, doc_id in enumerate(faiss_ids):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    for rank, doc_id in enumerate(bm25_ids):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

def hybrid_search(query: str, top_k: int = 5) -> list[SearchResult]:
    if not query.strip():
        return []
    papers = get_papers()
    n = min(20, len(papers))

    vec = _embedder.encode([query])
    _, faiss_ids_raw = _faiss_index.search(np.array(vec, dtype="float32"), n)
    faiss_ids = [int(i) for i in faiss_ids_raw[0] if i >= 0]

    bm25_scores = _bm25.get_scores(_tokenize(query))
    bm25_ids = list(map(int, np.argsort(bm25_scores)[::-1][:n]))

    fused = _rrf(faiss_ids, bm25_ids)[:10]
    candidate_ids = [doc_id for doc_id, _ in fused if doc_id < len(papers)]

    pairs = [(query, papers[i].abstract[:512]) for i in candidate_ids]
    rerank_scores = _reranker.predict(pairs)

    ranked = sorted(zip(candidate_ids, rerank_scores), key=lambda x: x[1], reverse=True)
    return [
        SearchResult(paper=papers[doc_id], score=float(score), rank=rank)
        for rank, (doc_id, score) in enumerate(ranked[:top_k])
    ]
```

- [ ] **Step 3: Run tests**

```powershell
pytest tests/test_search.py -v
```

Expected: 4 PASS (takes ~60s on first run — models download)

- [ ] **Step 4: Commit**

```bash
git add app/backend/src/search.py app/backend/tests/test_search.py
git commit -m "feat: add hybrid search with FAISS+BM25+RRF+cross-encoder reranking"
```

---

### Task 3: scispaCy NER + entity cache

**Files:**
- Create: `app/backend/src/ner.py`
- Create: `app/backend/tests/test_ner.py`

**Interfaces:**
- Consumes: `Paper` from `models`
- Produces: `load_ner() -> None`, `load_entity_cache() -> None`, `build_entity_cache(papers: list[Paper]) -> None`, `get_paper_entities(paper_id: int) -> list[dict]`, `extract_entities_from_text(text: str) -> list[dict]`
- Entity dict shape: `{"name": str, "type": "Gene"|"Disease"|"Chemical"}`

- [ ] **Step 1: Write failing test**

```python
# app/backend/tests/test_ner.py
import pytest
from src.ner import load_ner, extract_entities_from_text, build_entity_cache, get_paper_entities

@pytest.fixture(scope="module", autouse=True)
def setup_ner():
    load_ner()

def test_extract_disease_entity():
    entities = extract_entities_from_text("Patients with breast cancer showed BRCA1 mutations.")
    types = [e["type"] for e in entities]
    assert "Disease" in types

def test_extract_chemical_entity():
    entities = extract_entities_from_text("Treatment with doxorubicin reduced tumor size.")
    types = [e["type"] for e in entities]
    assert "Chemical" in types

def test_extract_gene_entity():
    entities = extract_entities_from_text("Expression of TP53 mRNA was significantly reduced.")
    types = [e["type"] for e in entities]
    assert "Gene" in types

def test_entity_has_name_and_type(mock_papers):
    build_entity_cache(mock_papers)
    entities = get_paper_entities(0)
    for e in entities:
        assert "name" in e
        assert e["type"] in ("Gene", "Disease", "Chemical")

def test_entity_cache_persists(tmp_path, mock_papers, monkeypatch):
    from src import ner as ner_module
    monkeypatch.setattr(ner_module, "CACHE_PATH", tmp_path / "entity_cache.json")
    monkeypatch.setattr(ner_module, "_entity_cache", {})
    build_entity_cache(mock_papers)
    assert (tmp_path / "entity_cache.json").exists()
```

- [ ] **Step 2: Write ner.py**

```python
# app/backend/src/ner.py
import json
from pathlib import Path
import spacy

CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "entity_cache.json"

_bc5cdr = None   # DISEASE, CHEMICAL
_jnlpba = None   # DNA, RNA, PROTEIN → Gene
_entity_cache: dict[int, list[dict]] = {}

_BC5CDR_MAP = {"DISEASE": "Disease", "CHEMICAL": "Chemical"}
_JNLPBA_MAP = {"DNA": "Gene", "RNA": "Gene", "PROTEIN": "Gene"}

def load_ner() -> None:
    global _bc5cdr, _jnlpba
    _bc5cdr = spacy.load("en_ner_bc5cdr_md")
    _jnlpba = spacy.load("en_ner_jnlpba_md")

def load_entity_cache() -> None:
    global _entity_cache
    if CACHE_PATH.exists():
        with open(CACHE_PATH) as f:
            _entity_cache = {int(k): v for k, v in json.load(f).items()}

def save_entity_cache() -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(_entity_cache, f)

def _extract(text: str) -> list[dict]:
    text = text[:1000]
    seen: set[str] = set()
    results = []
    for doc, label_map in [(_bc5cdr(text), _BC5CDR_MAP), (_jnlpba(text), _JNLPBA_MAP)]:
        for ent in doc.ents:
            etype = label_map.get(ent.label_)
            key = f"{etype}:{ent.text.lower()}"
            if etype and key not in seen:
                seen.add(key)
                results.append({"name": ent.text, "type": etype})
    return results

def build_entity_cache(papers) -> None:
    if _entity_cache:
        return
    for paper in papers:
        _entity_cache[paper.id] = _extract(paper.abstract)
    save_entity_cache()

def get_paper_entities(paper_id: int) -> list[dict]:
    return _entity_cache.get(paper_id, [])

def extract_entities_from_text(text: str) -> list[dict]:
    return _extract(text)
```

- [ ] **Step 3: Run tests**

```powershell
pytest tests/test_ner.py -v
```

Expected: 5 PASS

- [ ] **Step 4: Commit**

```bash
git add app/backend/src/ner.py app/backend/tests/test_ner.py
git commit -m "feat: add scispaCy biomedical NER with two-model pipeline and disk cache"
```

---

### Task 4: NetworkX knowledge graph

**Files:**
- Create: `app/backend/src/graph.py`
- Create: `app/backend/tests/test_graph.py`

**Interfaces:**
- Consumes: `get_papers()`, `get_paper_by_id()`, `get_paper_entities()`
- Produces: `build_graph() -> None`, `get_papers_by_entity(name: str) -> list[int]`, `get_entity_connections(entity: str) -> list[dict]`, `get_subgraph(entity_names: list[str]) -> SubgraphResponse`, `graph_stats() -> dict`

- [ ] **Step 1: Write failing test**

```python
# app/backend/tests/test_graph.py
import pytest
from src.graph import build_graph, get_papers_by_entity, get_entity_connections, get_subgraph, graph_stats
from src.ner import _entity_cache

@pytest.fixture(scope="module", autouse=True)
def setup(mock_papers):
    _entity_cache.clear()
    _entity_cache.update({
        0: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "CRISPR-Cas9", "type": "Chemical"}, {"name": "genome editing", "type": "Gene"}],
        2: [{"name": "TP53", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
    })
    from src import data_store as ds
    ds._papers = mock_papers
    build_graph()

def test_graph_stats_has_keys():
    stats = graph_stats()
    assert "paper_count" in stats
    assert "entity_count" in stats
    assert "edge_count" in stats

def test_get_papers_by_entity_finds_papers():
    ids = get_papers_by_entity("breast cancer")
    assert 0 in ids
    assert 2 in ids

def test_get_entity_connections_returns_list():
    conns = get_entity_connections("BRCA1")
    assert isinstance(conns, list)

def test_get_subgraph_returns_nodes_and_edges():
    result = get_subgraph(["breast cancer"])
    assert len(result.nodes) > 0

def test_get_subgraph_node_types_valid():
    result = get_subgraph(["BRCA1", "breast cancer"])
    valid_types = {"paper", "Gene", "Disease", "Chemical"}
    for node in result.nodes:
        assert node.type in valid_types
```

- [ ] **Step 2: Write graph.py**

```python
# app/backend/src/graph.py
import networkx as nx
from .models import GraphNode, GraphEdge, SubgraphResponse
from .data_store import get_papers
from .ner import get_paper_entities

_G: nx.DiGraph | None = None

def build_graph() -> None:
    global _G
    papers = get_papers()
    G = nx.DiGraph()

    entity_papers: dict[str, list[int]] = {}

    for paper in papers:
        pid = f"paper_{paper.id}"
        G.add_node(pid, kind="paper", label=paper.title[:60], paper_id=paper.id)
        for ent in get_paper_entities(paper.id):
            ekey = f"{ent['type']}:{ent['name'].lower()}"
            if not G.has_node(ekey):
                G.add_node(ekey, kind=ent["type"], label=ent["name"])
            G.add_edge(pid, ekey, rel="mentions")
            entity_papers.setdefault(ekey, []).append(paper.id)

    keys = list(entity_papers.keys())
    for i, k1 in enumerate(keys):
        for k2 in keys[i + 1:]:
            shared = len(set(entity_papers[k1]) & set(entity_papers[k2]))
            if shared >= 2:
                G.add_edge(k1, k2, rel="co_occurs_with", weight=shared)
                G.add_edge(k2, k1, rel="co_occurs_with", weight=shared)
    _G = G

def graph_stats() -> dict:
    G = _G
    kinds = nx.get_node_attributes(G, "kind")
    entity_count = sum(1 for k in kinds.values() if k != "paper")
    return {
        "paper_count": sum(1 for k in kinds.values() if k == "paper"),
        "entity_count": entity_count,
        "edge_count": G.number_of_edges(),
    }

def get_papers_by_entity(name: str) -> list[int]:
    needle = name.lower()
    ids: list[int] = []
    for node, data in _G.nodes(data=True):
        if data.get("kind") != "paper" and needle in node.lower():
            for pred in _G.predecessors(node):
                if _G.nodes[pred].get("kind") == "paper":
                    pid = _G.nodes[pred].get("paper_id")
                    if pid is not None:
                        ids.append(pid)
    return list(set(ids))

def get_entity_connections(entity: str) -> list[dict]:
    needle = entity.lower()
    conns: dict[str, dict] = {}
    for node in _G.nodes:
        if _G.nodes[node].get("kind") != "paper" and needle in node.lower():
            for nbr in _G.successors(node):
                edata = _G.edges[node, nbr]
                if edata.get("rel") == "co_occurs_with":
                    nd = _G.nodes[nbr]
                    w = edata.get("weight", 1)
                    if nbr not in conns or conns[nbr]["weight"] < w:
                        conns[nbr] = {"name": nd.get("label", nbr), "type": nd.get("kind", "Entity"), "weight": w}
    return sorted(conns.values(), key=lambda x: x["weight"], reverse=True)[:20]

def get_subgraph(entity_names: list[str]) -> SubgraphResponse:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen: set[str] = set()

    def _add_node(nid: str):
        if nid in seen:
            return
        seen.add(nid)
        d = _G.nodes[nid]
        kind = d.get("kind", "Entity")
        ntype = kind if kind in ("paper", "Gene", "Disease", "Chemical") else "Gene"
        nodes.append(GraphNode(id=nid, label=d.get("label", nid)[:40], type=ntype))

    for name in entity_names:
        needle = name.lower()
        matches = [n for n in _G.nodes if _G.nodes[n].get("kind") != "paper" and needle in n.lower()][:3]
        for key in matches:
            _add_node(key)
            for nbr in list(_G.successors(key))[:8]:
                if _G.nodes[nbr].get("kind") != "paper":
                    _add_node(nbr)
                    ed = _G.edges[key, nbr]
                    edges.append(GraphEdge(source=key, target=nbr,
                                           type=ed.get("rel", "co_occurs_with"),
                                           weight=float(ed.get("weight", 1))))
    return SubgraphResponse(nodes=nodes, edges=edges)
```

- [ ] **Step 3: Run tests**

```powershell
pytest tests/test_graph.py -v
```

Expected: 5 PASS

- [ ] **Step 4: Commit**

```bash
git add app/backend/src/graph.py app/backend/tests/test_graph.py
git commit -m "feat: add NetworkX knowledge graph with entity co-occurrence edges"
```

---

### Task 5: Claude agent + SSE streaming

**Files:**
- Create: `app/backend/src/agent.py`
- Create: `app/backend/tests/test_agent.py`

**Interfaces:**
- Consumes: `hybrid_search`, `get_papers_by_entity`, `get_entity_connections`, `get_paper_by_id`, `get_paper_entities`, `extract_entities_from_text`
- Produces: `async def run_agent_stream(question: str) -> AsyncGenerator[str, None]` — yields SSE-formatted strings

SSE event shapes (JSON after `data: `):
```
{"type": "tool_call",    "tool": str, "input": dict}
{"type": "tool_result",  "tool": str, "summary": str}
{"type": "reasoning",    "text": str}
{"type": "graph_update", "nodes": list, "edges": list}
{"type": "done",         "citations": list[str]}
```

- [ ] **Step 1: Write failing test**

```python
# app/backend/tests/test_agent.py
import json, pytest, asyncio
from unittest.mock import patch, AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_run_agent_stream_yields_sse_events(mock_papers):
    from src import data_store as ds
    from src import ner as ner_module
    ds._papers = mock_papers
    ner_module._entity_cache = {
        0: [{"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "CRISPR-Cas9", "type": "Chemical"}],
        2: [{"name": "TP53", "type": "Gene"}],
    }

    fake_msg = MagicMock()
    fake_msg.stop_reason = "end_turn"
    fake_msg.content = [MagicMock(type="text", text="Based on the papers, BRCA1 is important.")]

    fake_stream = AsyncMock()
    fake_stream.__aenter__ = AsyncMock(return_value=fake_stream)
    fake_stream.__aexit__ = AsyncMock(return_value=False)
    fake_stream.__aiter__ = MagicMock(return_value=iter([
        MagicMock(type="content_block_delta", delta=MagicMock(type="text_delta", text="Answer text")),
    ]))
    fake_stream.get_final_message = AsyncMock(return_value=fake_msg)

    with patch("src.agent.client") as mock_client:
        mock_client.messages.stream.return_value = fake_stream
        from src.agent import run_agent_stream
        events = []
        async for chunk in run_agent_stream("What is BRCA1?"):
            if chunk.startswith("data: "):
                events.append(json.loads(chunk[6:]))

    types = [e["type"] for e in events]
    assert "done" in types

@pytest.mark.asyncio
async def test_execute_tool_hybrid_search(mock_papers):
    from src import data_store as ds, search as search_module
    ds._papers = mock_papers
    with patch("src.agent._execute_tool") as mock_tool:
        mock_tool.return_value = json.dumps([{"id": 0, "title": "BRCA1 paper", "doi": "10.x/1", "url": "http://x", "score": 0.9, "abstract_snippet": "BRCA1..."}])
        from src.agent import _execute_tool
        result = _execute_tool("hybrid_search", {"query": "BRCA1 cancer", "k": 3})
        data = json.loads(result)
        assert isinstance(data, list)
```

- [ ] **Step 2: Write agent.py**

```python
# app/backend/src/agent.py
import json, re, asyncio
from typing import AsyncGenerator
import anthropic
from .search import hybrid_search
from .graph import get_papers_by_entity, get_entity_connections, get_subgraph
from .data_store import get_paper_by_id
from .ner import get_paper_entities, extract_entities_from_text

client = anthropic.AsyncAnthropic()

TOOLS = [
    {"name": "hybrid_search",
     "description": "Search the 7,070 genomics paper corpus using hybrid semantic+lexical retrieval with reranking.",
     "input_schema": {"type": "object", "properties": {
         "query": {"type": "string"},
         "k": {"type": "integer", "default": 5}
     }, "required": ["query"]}},
    {"name": "get_papers_by_entity",
     "description": "Find papers mentioning a specific gene, disease, or chemical by name.",
     "input_schema": {"type": "object", "properties": {
         "name": {"type": "string"},
         "entity_type": {"type": "string", "enum": ["Gene", "Disease", "Chemical"]}
     }, "required": ["name", "entity_type"]}},
    {"name": "get_entity_connections",
     "description": "Find biomedical entities that co-occur with a given entity across the corpus.",
     "input_schema": {"type": "object", "properties": {
         "entity": {"type": "string"}
     }, "required": ["entity"]}},
    {"name": "get_paper_details",
     "description": "Get full abstract, authors, DOI, and extracted entities for a paper by ID.",
     "input_schema": {"type": "object", "properties": {
         "paper_id": {"type": "integer"}
     }, "required": ["paper_id"]}},
    {"name": "extract_query_entities",
     "description": "Extract biomedical entities (genes, diseases, chemicals) from a query string.",
     "input_schema": {"type": "object", "properties": {
         "query": {"type": "string"}
     }, "required": ["query"]}},
]

SYSTEM = """You are a genomics research assistant with access to 7,070 bioRxiv genomics papers.
Strategy: (1) extract key entities from the question, (2) hybrid_search for broad retrieval,
(3) use entity connections to expand via knowledge graph, (4) get_paper_details for top results,
(5) write a grounded answer citing papers as [Author et al., DOI].
Only claim what the papers support."""

def _execute_tool(name: str, inp: dict) -> str:
    try:
        if name == "hybrid_search":
            results = hybrid_search(inp["query"], inp.get("k", 5))
            return json.dumps([{"id": r.paper.id, "title": r.paper.title,
                                 "authors": r.paper.authors, "doi": r.paper.doi,
                                 "url": r.paper.url, "score": r.score,
                                 "abstract_snippet": r.paper.abstract[:300]} for r in results])
        if name == "get_papers_by_entity":
            ids = get_papers_by_entity(inp["name"])
            papers = [get_paper_by_id(i) for i in ids[:10]]
            return json.dumps([{"id": p.id, "title": p.title, "doi": p.doi}
                                for p in papers if p])
        if name == "get_entity_connections":
            return json.dumps(get_entity_connections(inp["entity"]))
        if name == "get_paper_details":
            p = get_paper_by_id(inp["paper_id"])
            if not p:
                return json.dumps({"error": "not found"})
            return json.dumps({"id": p.id, "title": p.title, "authors": p.authors,
                                "doi": p.doi, "url": p.url, "date": p.date,
                                "abstract": p.abstract, "summary": p.summary,
                                "entities": get_paper_entities(p.id)})
        if name == "extract_query_entities":
            return json.dumps(extract_entities_from_text(inp["query"]))
        return json.dumps({"error": f"unknown tool {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})

def _graph_events(tool_name: str, result: str) -> list[dict]:
    try:
        data = json.loads(result)
        if tool_name == "hybrid_search":
            nodes = [{"id": f"paper_{p['id']}", "label": p["title"][:40], "type": "paper"}
                     for p in data]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
        if tool_name == "extract_query_entities":
            nodes = [{"id": f"{e['type']}:{e['name'].lower()}", "label": e["name"], "type": e["type"]}
                     for e in data]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
        if tool_name == "get_entity_connections":
            nodes = [{"id": f"{c['type']}:{c['name'].lower()}", "label": c["name"], "type": c["type"]}
                     for c in data[:12]]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
    except Exception:
        pass
    return []

def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"

async def run_agent_stream(question: str) -> AsyncGenerator[str, None]:
    messages = [{"role": "user", "content": question}]
    while True:
        tool_calls: list[dict] = []
        text_buf = ""
        async with client.messages.stream(
            model="claude-sonnet-4-6", max_tokens=4096,
            system=SYSTEM, tools=TOOLS, messages=messages
        ) as stream:
            async for event in stream:
                etype = getattr(event, "type", None)
                if etype == "content_block_start":
                    cb = event.content_block
                    if getattr(cb, "type", None) == "tool_use":
                        tool_calls.append({"id": cb.id, "name": cb.name, "buf": ""})
                        yield _sse({"type": "tool_call", "tool": cb.name, "input": {}})
                elif etype == "content_block_delta":
                    d = event.delta
                    if getattr(d, "type", None) == "text_delta":
                        text_buf += d.text
                        yield _sse({"type": "reasoning", "text": d.text})
                    elif getattr(d, "type", None) == "input_json_delta" and tool_calls:
                        tool_calls[-1]["buf"] += d.partial_json
            final = await stream.get_final_message()

        stop = final.stop_reason
        for tc in tool_calls:
            try:
                tc["input"] = json.loads(tc["buf"]) if tc["buf"] else {}
            except json.JSONDecodeError:
                tc["input"] = {}

        if stop == "tool_use" and tool_calls:
            content = []
            if text_buf:
                content.append({"type": "text", "text": text_buf})
            for tc in tool_calls:
                content.append({"type": "tool_use", "id": tc["id"],
                                 "name": tc["name"], "input": tc["input"]})
            messages.append({"role": "assistant", "content": content})

            tool_results = []
            for tc in tool_calls:
                result = await asyncio.to_thread(_execute_tool, tc["name"], tc["input"])
                for ge in _graph_events(tc["name"], result):
                    yield _sse(ge)
                yield _sse({"type": "tool_result", "tool": tc["name"],
                             "summary": result[:300]})
                tool_results.append({"type": "tool_result",
                                      "tool_use_id": tc["id"], "content": result})
            messages.append({"role": "user", "content": tool_results})
        else:
            dois = re.findall(r'10\.\d{4,}[^\s\]]+', text_buf)
            yield _sse({"type": "done", "citations": list(set(dois))})
            break
```

- [ ] **Step 3: Run tests**

```powershell
pytest tests/test_agent.py -v
```

Expected: 2 PASS

- [ ] **Step 4: Commit**

```bash
git add app/backend/src/agent.py app/backend/tests/test_agent.py
git commit -m "feat: add Claude agentic layer with 5 tools and SSE streaming"
```

---

### Task 6: FastAPI routers + app wiring

**Files:**
- Create: `app/backend/main.py`
- Create: `app/backend/src/routers/health.py`
- Create: `app/backend/src/routers/search.py`
- Create: `app/backend/src/routers/paper.py`
- Create: `app/backend/src/routers/graph_routes.py`
- Create: `app/backend/src/routers/ask.py`
- Create: `app/backend/tests/test_routers.py`

**Interfaces:**
- Produces: running FastAPI server on port 8000 with all routes from the spec

- [ ] **Step 1: Write failing tests**

```python
# app/backend/tests/test_routers.py
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
import json

@pytest.fixture(scope="module")
async def client():
    from main import create_app
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "paper_count" in data

@pytest.mark.asyncio
async def test_search_returns_results(client):
    r = await client.get("/search?q=CRISPR&k=3")
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert len(data["results"]) <= 3

@pytest.mark.asyncio
async def test_paper_by_id(client):
    r = await client.get("/paper/0")
    assert r.status_code == 200
    assert "title" in r.json()

@pytest.mark.asyncio
async def test_paper_not_found(client):
    r = await client.get("/paper/9999999")
    assert r.status_code == 404

@pytest.mark.asyncio
async def test_graph_stats(client):
    r = await client.get("/graph/stats")
    assert r.status_code == 200
    assert "entity_count" in r.json()
```

- [ ] **Step 2: Write routers**

```python
# app/backend/src/routers/health.py
from fastapi import APIRouter
from ..data_store import get_papers
from ..graph import graph_stats

router = APIRouter()

@router.get("/health")
async def health():
    papers = get_papers()
    stats = graph_stats()
    return {"status": "ok", "paper_count": len(papers), **stats}

@router.get("/stats")
async def stats():
    papers = get_papers()
    avg_words = sum(len(p.abstract.split()) for p in papers) / max(len(papers), 1)
    return {**graph_stats(), "avg_abstract_words": round(avg_words, 1),
            "papers_with_summary": sum(1 for p in papers if p.summary)}
```

```python
# app/backend/src/routers/search.py
from fastapi import APIRouter, Query
from ..search import hybrid_search

router = APIRouter()

@router.get("/search")
async def search(q: str = Query(""), k: int = Query(5, ge=1, le=20)):
    if not q.strip():
        return {"query": q, "results": []}
    results = hybrid_search(q, top_k=k)
    return {"query": q, "results": [
        {"id": r.paper.id, "title": r.paper.title, "authors": r.paper.authors,
         "doi": r.paper.doi, "url": r.paper.url, "date": r.paper.date,
         "abstract": r.paper.abstract, "summary": r.paper.summary,
         "score": r.score, "rank": r.rank}
        for r in results
    ]}
```

```python
# app/backend/src/routers/paper.py
from fastapi import APIRouter, HTTPException
from ..data_store import get_paper_by_id
from ..ner import get_paper_entities

router = APIRouter()

@router.get("/paper/{paper_id}")
async def paper(paper_id: int):
    p = get_paper_by_id(paper_id)
    if not p:
        raise HTTPException(404, "not found")
    return {**p.model_dump(), "entities": get_paper_entities(paper_id)}
```

```python
# app/backend/src/routers/graph_routes.py
from fastapi import APIRouter, HTTPException, Query
from ..graph import get_papers_by_entity, get_entity_connections, get_subgraph, graph_stats
from ..data_store import get_paper_by_id

router = APIRouter()

@router.get("/entity/{name}")
async def entity(name: str):
    ids = get_papers_by_entity(name)
    papers = [get_paper_by_id(i) for i in ids[:20]]
    conns = get_entity_connections(name)
    return {"entity": name, "paper_count": len(ids),
            "papers": [{"id": p.id, "title": p.title, "doi": p.doi} for p in papers if p],
            "connections": conns}

@router.get("/graph/subgraph")
async def subgraph(entities: str = Query("")):
    names = [e.strip() for e in entities.split(",") if e.strip()]
    if not names:
        return {"nodes": [], "edges": []}
    return get_subgraph(names)

@router.get("/graph/stats")
async def stats():
    return graph_stats()
```

```python
# app/backend/src/routers/ask.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ..agent import run_agent_stream

router = APIRouter()

class AskBody(BaseModel):
    question: str

@router.post("/ask")
async def ask(body: AskBody):
    if not body.question.strip():
        return {"error": "question required"}
    return StreamingResponse(
        run_agent_stream(body.question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

- [ ] **Step 3: Write main.py**

```python
# app/backend/main.py
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.data_store import load_papers
from src.search import load_search_indexes
from src.ner import load_ner, load_entity_cache, build_entity_cache
from src.graph import build_graph
from src.routers import health, search, paper, graph_routes, ask

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading papers...")
    papers = load_papers()
    print(f"  {len(papers)} papers loaded")
    print("Loading search indexes...")
    load_search_indexes()
    print("Loading NER models...")
    load_ner()
    load_entity_cache()
    print("Building entity cache (skipped if cached)...")
    build_entity_cache(papers)
    print("Building knowledge graph...")
    build_graph()
    print("Ready.")
    yield

def create_app() -> FastAPI:
    app = FastAPI(title="GenomicIR-NLP", lifespan=lifespan)
    app.add_middleware(CORSMiddleware,
                       allow_origins=["http://localhost:5173"],
                       allow_methods=["*"], allow_headers=["*"])
    app.include_router(health.router)
    app.include_router(search.router)
    app.include_router(paper.router)
    app.include_router(graph_routes.router)
    app.include_router(ask.router)
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
```

- [ ] **Step 4: Run full test suite**

```powershell
cd app\backend
pytest tests/ -v --ignore=tests/test_search.py  # skip slow model tests in CI
```

Expected: all PASS except skipped

- [ ] **Step 5: Smoke test the server**

```powershell
python main.py  # wait for "Ready." (~60s first run, faster after cache)
# In another terminal:
curl http://localhost:8000/health
curl "http://localhost:8000/search?q=CRISPR&k=3"
```

Expected: JSON with `status: ok` and search results

- [ ] **Step 6: Commit**

```bash
git add app/backend/main.py app/backend/src/routers/ app/backend/tests/test_routers.py
git commit -m "feat: add FastAPI routers and startup wiring — backend complete"
```

---

### Task 7: Frontend scaffold (Vite + React 18 + Tailwind + routing)

**Files:**
- Create: `app/frontend/package.json`
- Create: `app/frontend/vite.config.ts`
- Create: `app/frontend/tailwind.config.ts`
- Create: `app/frontend/postcss.config.js`
- Create: `app/frontend/tsconfig.json`
- Create: `app/frontend/index.html`
- Create: `app/frontend/src/main.tsx`
- Create: `app/frontend/src/App.tsx`

**Interfaces:**
- Produces: Vite dev server on port 5173 with React Router routes for `/`, `/ask`, `/search`, `/explore`, `/paper/:id`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "genomic-ir-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "d3": "^7.9.0",
    "framer-motion": "^11.2.10"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/d3": "^7.4.3",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.2.12"
  }
}
```

- [ ] **Step 2: Write config files**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8000', rewrite: p => p.replace(/^\/api/, '') } } }
})
```

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0a0f1e', 900: '#060b14', 800: '#0d1426' },
        genomic: { cyan: '#06b6d4', emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] }
    }
  }
} satisfies Config
```

```javascript
// postcss.config.js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020","DOM","DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler",
    "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true,
    "noEmit": true, "jsx": "react-jsx", "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GenomicIR — Agentic Research</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-navy text-white font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Write main.tsx**

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

- [ ] **Step 5: Create index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { background-color: #0a0f1e; color: white; }
}

@layer utilities {
  .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
  .text-gradient { background: linear-gradient(135deg, #06b6d4, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
}
```

- [ ] **Step 6: Write App.tsx with routes**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Nav from './components/Nav'

const Home = lazy(() => import('./pages/Home'))
const Ask = lazy(() => import('./pages/Ask'))
const Search = lazy(() => import('./pages/Search'))
const GraphExplorer = lazy(() => import('./pages/GraphExplorer'))
const PaperDetail = lazy(() => import('./pages/PaperDetail'))

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="min-h-screen pt-16">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-genomic-cyan">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/search" element={<Search />} />
            <Route path="/explore" element={<GraphExplorer />} />
            <Route path="/paper/:id" element={<PaperDetail />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}
```

- [ ] **Step 7: Install and verify**

```powershell
cd app\frontend
npm install
npm run dev
```

Open `http://localhost:5173` — expect blank page (no pages yet) with no console errors.

- [ ] **Step 8: Commit**

```bash
git add app/frontend/
git commit -m "feat: scaffold React 18 + Vite + Tailwind frontend with routing"
```

---

### Task 8: API client + useSSE + useGraph hooks

**Files:**
- Create: `app/frontend/src/lib/api.ts`
- Create: `app/frontend/src/hooks/useSSE.ts`
- Create: `app/frontend/src/hooks/useGraph.ts`

**Interfaces:**
- Produces:
  - `api.search(q, k) -> Promise<SearchResponse>`
  - `api.paper(id) -> Promise<PaperDetail>`
  - `api.stats() -> Promise<Stats>`
  - `api.entity(name) -> Promise<EntityResponse>`
  - `api.subgraph(entities) -> Promise<SubgraphResponse>`
  - `useSSE(): { stream(url, body, onEvent), cancel }`
  - `useGraph(): { nodes, edges, addNodes, addEdges, reset }`

- [ ] **Step 1: Write api.ts**

```typescript
// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Paper { id: number; title: string; authors: string; doi: string; date: string; url: string; abstract: string; summary: string }
export interface SearchResult { paper: Paper; score: number; rank: number }
export interface SearchResponse { query: string; results: SearchResult[] }
export interface Stats { paper_count: number; entity_count: number; edge_count: number; avg_abstract_words: number }
export interface PaperDetail extends Paper { entities: { name: string; type: string }[] }
export interface EntityResponse { entity: string; paper_count: number; papers: { id: number; title: string; doi: string }[]; connections: { name: string; type: string; weight: number }[] }
export interface GraphNode { id: string; label: string; type: 'paper' | 'Gene' | 'Disease' | 'Chemical' }
export interface GraphEdge { source: string; target: string; type: string; weight: number }
export interface SubgraphResponse { nodes: GraphNode[]; edges: GraphEdge[] }

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  stats: () => get<Stats>('/stats'),
  search: (q: string, k = 5) => get<SearchResponse>(`/search?q=${encodeURIComponent(q)}&k=${k}`),
  paper: (id: number) => get<PaperDetail>(`/paper/${id}`),
  entity: (name: string) => get<EntityResponse>(`/entity/${encodeURIComponent(name)}`),
  subgraph: (entities: string[]) => get<SubgraphResponse>(`/graph/subgraph?entities=${entities.map(encodeURIComponent).join(',')}`),
}
```

- [ ] **Step 2: Write useSSE.ts**

```typescript
// src/hooks/useSSE.ts
import { useCallback, useRef } from 'react'

export interface SSEEvent {
  type: 'tool_call' | 'tool_result' | 'reasoning' | 'graph_update' | 'done'
  [key: string]: unknown
}

export function useSSE() {
  const abortRef = useRef<AbortController | null>(null)

  const stream = useCallback(async (
    url: string,
    body: object,
    onEvent: (e: SSEEvent) => void,
    onError?: (e: Error) => void
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const reader = resp.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { onEvent(JSON.parse(line.slice(6))) } catch {}
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') onError?.(e as Error)
    }
  }, [])

  const cancel = useCallback(() => abortRef.current?.abort(), [])
  return { stream, cancel }
}
```

- [ ] **Step 3: Write useGraph.ts**

```typescript
// src/hooks/useGraph.ts
import { useState, useCallback } from 'react'
import type { GraphNode, GraphEdge } from '../lib/api'

export function useGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  const addNodes = useCallback((incoming: GraphNode[]) => {
    setNodes(prev => {
      const ids = new Set(prev.map(n => n.id))
      return [...prev, ...incoming.filter(n => !ids.has(n.id))]
    })
  }, [])

  const addEdges = useCallback((incoming: GraphEdge[]) => {
    setEdges(prev => {
      const keys = new Set(prev.map(e => `${e.source}-${e.target}`))
      return [...prev, ...incoming.filter(e => !keys.has(`${e.source}-${e.target}`))]
    })
  }, [])

  const reset = useCallback(() => { setNodes([]); setEdges([]) }, [])

  return { nodes, edges, addNodes, addEdges, reset }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/frontend/src/lib/ app/frontend/src/hooks/
git commit -m "feat: add typed API client, useSSE, and useGraph hooks"
```

---

### Task 9: Shared components (Nav, PaperCard, EntityChip, SearchBar)

**Files:**
- Create: `app/frontend/src/components/Nav.tsx`
- Create: `app/frontend/src/components/PaperCard.tsx`
- Create: `app/frontend/src/components/EntityChip.tsx`
- Create: `app/frontend/src/components/SearchBar.tsx`

- [ ] **Step 1: Write Nav.tsx**

```tsx
// src/components/Nav.tsx
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/ask', label: 'Research Assistant' },
  { to: '/search', label: 'Search' },
  { to: '/explore', label: 'Graph Explorer' },
]

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gradient">GenomicIR</Link>
        <div className="flex gap-6">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-sm transition-colors ${pathname === l.to ? 'text-genomic-cyan font-medium' : 'text-white/60 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Write EntityChip.tsx**

```tsx
// src/components/EntityChip.tsx
const COLORS = {
  Gene:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Disease:  'bg-rose-500/20    text-rose-300    border-rose-500/30',
  Chemical: 'bg-amber-500/20   text-amber-300   border-amber-500/30',
}

interface Props { name: string; type: 'Gene' | 'Disease' | 'Chemical'; onClick?: () => void }

export default function EntityChip({ name, type, onClick }: Props) {
  return (
    <span onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium cursor-pointer ${COLORS[type] ?? COLORS.Gene}`}>
      {name}
    </span>
  )
}
```

- [ ] **Step 3: Write PaperCard.tsx**

```tsx
// src/components/PaperCard.tsx
import { Link } from 'react-router-dom'
import type { SearchResult } from '../lib/api'

interface Props { result: SearchResult; showScore?: boolean }

export default function PaperCard({ result, showScore }: Props) {
  const { paper, score } = result
  return (
    <div className="glass rounded-xl p-5 hover:border-genomic-cyan/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/paper/${paper.id}`} className="text-white font-medium hover:text-genomic-cyan transition-colors line-clamp-2">
          {paper.title}
        </Link>
        {showScore && (
          <span className="shrink-0 text-xs text-genomic-cyan font-mono bg-genomic-cyan/10 px-2 py-1 rounded">
            {score.toFixed(3)}
          </span>
        )}
      </div>
      <p className="text-white/50 text-sm mt-1">{paper.authors} · {paper.date}</p>
      <p className="text-white/70 text-sm mt-2 line-clamp-3">{paper.abstract}</p>
      <div className="flex gap-3 mt-3">
        {paper.doi && <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
          className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan">DOI →</a>}
        {paper.url && <a href={paper.url} target="_blank" rel="noreferrer"
          className="text-xs text-white/40 hover:text-white/70">bioRxiv →</a>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write SearchBar.tsx**

```tsx
// src/components/SearchBar.tsx
import { FormEvent, useState } from 'react'

interface Props { onSearch: (q: string) => void; placeholder?: string; loading?: boolean }

export default function SearchBar({ onSearch, placeholder = 'Search genomics papers…', loading }: Props) {
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()) }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 transition-colors" />
      <button type="submit" disabled={loading}
        className="px-5 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors">
        {loading ? '…' : 'Search'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/frontend/src/components/Nav.tsx app/frontend/src/components/PaperCard.tsx app/frontend/src/components/EntityChip.tsx app/frontend/src/components/SearchBar.tsx
git commit -m "feat: add Nav, PaperCard, EntityChip, SearchBar shared components"
```

---

### Task 10: Home page

**Files:**
- Create: `app/frontend/src/pages/Home.tsx`

- [ ] **Step 1: Write Home.tsx**

```tsx
// src/pages/Home.tsx
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type Stats } from '../lib/api'

function AnimatedCount({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const step = target / 60
    let cur = 0
    const id = setInterval(() => { cur = Math.min(cur + step, target); setVal(Math.floor(cur)); if (cur >= target) clearInterval(id) }, 16)
    return () => clearInterval(id)
  }, [target])
  return <span>{val.toLocaleString()}</span>
}

function DNABackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let frame = 0
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(6,182,212,0.15)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < canvas.height; i += 6) {
        const t = (i + frame) / 40
        const x1 = canvas.width / 2 + Math.sin(t) * 60
        const x2 = canvas.width / 2 - Math.sin(t) * 60
        ctx.beginPath(); ctx.arc(x1, i, 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(16,185,129,0.4)'; ctx.fill()
        ctx.beginPath(); ctx.arc(x2, i, 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(6,182,212,0.4)'; ctx.fill()
        if (i % 30 === 0) { ctx.beginPath(); ctx.moveTo(x1, i); ctx.lineTo(x2, i); ctx.stroke() }
      }
      frame += 0.5
      requestAnimationFrame(animate)
    }
    animate()
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => { api.stats().then(setStats).catch(() => {}) }, [])

  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        <DNABackground />
        <div className="relative z-10 text-center max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-genomic-cyan text-sm font-mono tracking-widest uppercase mb-4">
            NLP × Genomics × Agentic AI
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl font-bold leading-tight mb-6">
            Decode the literature of <span className="text-gradient">life itself</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/60 text-lg mb-10">
            An agentic Claude-powered research assistant over 7,000+ bioRxiv genomics papers — hybrid retrieval, live knowledge graphs, grounded answers.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center">
            <Link to="/ask" className="px-7 py-3.5 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 transition-colors">
              Ask a question →
            </Link>
            <Link to="/search" className="px-7 py-3.5 glass rounded-xl hover:border-white/30 transition-colors">
              Search papers
            </Link>
          </motion.div>
        </div>
      </section>

      {stats && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
            {[
              { label: 'Papers indexed', value: stats.paper_count },
              { label: 'Entity nodes', value: stats.entity_count },
              { label: 'Graph edges', value: stats.edge_count },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-8 text-center">
                <div className="text-4xl font-bold text-gradient mb-2"><AnimatedCount target={s.value} /></div>
                <div className="text-white/50 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-10">Three lenses on the genome</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { to: '/ask', title: 'Research Assistant', desc: 'Agentic Claude with live knowledge graph and grounded citations', color: 'text-genomic-cyan' },
              { to: '/search', title: 'Hybrid Search', desc: 'FAISS + BM25 + cross-encoder reranking over 7,070 abstracts', color: 'text-genomic-emerald' },
              { to: '/explore', title: 'Graph Explorer', desc: 'Browse entity co-occurrence network interactively', color: 'text-genomic-amber' },
            ].map(c => (
              <Link key={c.to} to={c.to} className="glass rounded-2xl p-6 hover:border-white/30 transition-colors group">
                <h3 className={`font-semibold mb-2 ${c.color}`}>{c.title}</h3>
                <p className="text-white/50 text-sm">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```powershell
cd app\frontend && npm run dev
```

Open `http://localhost:5173` — expect hero section with animated DNA background, stats counters (if backend running), three feature cards.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/pages/Home.tsx
git commit -m "feat: add Home page with DNA animation, stats counters, and nav"
```

---

### Task 11: Search page

**Files:**
- Create: `app/frontend/src/pages/Search.tsx`

- [ ] **Step 1: Write Search.tsx**

```tsx
// src/pages/Search.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import EntityChip from '../components/EntityChip'
import { api, type SearchResult } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Search() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = async (q: string) => {
    setQuery(q); setLoading(true)
    try {
      const data = await api.search(q, 10)
      setResults(data.results)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Hybrid Search</h1>
      <p className="text-white/50 mb-8">FAISS semantic + BM25 lexical + cross-encoder reranking</p>
      <SearchBar onSearch={handleSearch} loading={loading} />

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
            <p className="text-white/40 text-sm">{results.length} results for "{query}"</p>
            {results.map(r => <PaperCard key={r.paper.id} result={r} showScore />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser** — navigate to `/search`, type a query, see results

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/pages/Search.tsx
git commit -m "feat: add Search page with hybrid retrieval results"
```

---

### Task 12: KnowledgeGraph D3 component

**Files:**
- Create: `app/frontend/src/components/KnowledgeGraph.tsx`

- [ ] **Step 1: Write KnowledgeGraph.tsx**

```tsx
// src/components/KnowledgeGraph.tsx
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '../lib/api'

const NODE_COLOR: Record<string, string> = {
  paper: '#3b82f6', Gene: '#10b981', Disease: '#f43f5e', Chemical: '#f59e0b',
}
const NODE_RADIUS: Record<string, number> = {
  paper: 10, Gene: 7, Disease: 7, Chemical: 7,
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  className?: string
}

type SimNode = GraphNode & d3.SimulationNodeDatum
type SimEdge = { source: SimNode | string; target: SimNode | string; type: string; weight: number }

export default function KnowledgeGraph({ nodes, edges, onNodeClick, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<SimNode, SimEdge> | null>(null)
  const gRef = useRef<SVGGElement | null>(null)

  // Init SVG once
  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    svg.selectAll('*').remove()
    const g = svg.append('g')
    gRef.current = g.node()
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 6])
        .on('zoom', ev => g.attr('transform', ev.transform))
    )
    return () => { simRef.current?.stop() }
  }, [])

  // Update graph when nodes/edges change
  useEffect(() => {
    if (!gRef.current || !svgRef.current) return
    const svg = svgRef.current
    const w = svg.clientWidth || 800
    const h = svg.clientHeight || 600
    const g = d3.select(gRef.current)

    const simNodes: SimNode[] = nodes.map(n => ({ ...n }))
    const nodeMap = new Map(simNodes.map(n => [n.id, n]))
    const simEdges: SimEdge[] = edges
      .filter(e => nodeMap.has(e.source as string) && nodeMap.has(e.target as string))
      .map(e => ({ ...e, source: e.source, target: e.target }))

    if (!simRef.current) {
      simRef.current = d3.forceSimulation<SimNode>()
        .force('link', d3.forceLink<SimNode, SimEdge>().id(d => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force('collision', d3.forceCollide(18))
    }

    const sim = simRef.current
    sim.nodes(simNodes)
    ;(sim.force('link') as d3.ForceLink<SimNode, SimEdge>).links(simEdges)

    // Edges
    g.selectAll<SVGLineElement, SimEdge>('.edge')
      .data(simEdges, d => `${(d.source as SimNode).id ?? d.source}-${(d.target as SimNode).id ?? d.target}`)
      .join(
        enter => enter.append('line').attr('class', 'edge')
          .attr('stroke', 'rgba(255,255,255,0.12)')
          .attr('stroke-width', d => Math.sqrt(d.weight || 1)),
        update => update,
        exit => exit.remove()
      )

    // Nodes
    const nodeGroup = g.selectAll<SVGGElement, SimNode>('.node')
      .data(simNodes, d => d.id)
      .join(
        enter => {
          const eg = enter.append('g').attr('class', 'node').style('cursor', 'pointer')
            .call(d3.drag<SVGGElement, SimNode>()
              .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
              .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y })
              .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
            )
            .on('click', (_, d) => onNodeClick?.(d))
          eg.append('circle')
            .attr('r', 0)
            .attr('fill', d => NODE_COLOR[d.type] ?? '#6b7280')
            .attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1.5)
            .transition().duration(400).attr('r', d => NODE_RADIUS[d.type] ?? 7)
          eg.append('title').text(d => d.label)
          return eg
        },
        update => update,
        exit => exit.transition().duration(200).remove()
      )

    sim.on('tick', () => {
      g.selectAll<SVGLineElement, SimEdge>('.edge')
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0)
      g.selectAll<SVGGElement, SimNode>('.node')
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    sim.alpha(0.4).restart()
  }, [nodes, edges, onNodeClick])

  return (
    <svg ref={svgRef} className={className ?? 'w-full h-full'}
      style={{ background: 'transparent' }} />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/frontend/src/components/KnowledgeGraph.tsx
git commit -m "feat: add D3 force-directed KnowledgeGraph component"
```

---

### Task 13: ReasoningTrace + AnswerCard components

**Files:**
- Create: `app/frontend/src/components/ReasoningTrace.tsx`
- Create: `app/frontend/src/components/AnswerCard.tsx`

- [ ] **Step 1: Write ReasoningTrace.tsx**

```tsx
// src/components/ReasoningTrace.tsx
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TraceEntry {
  id: string
  kind: 'tool_call' | 'tool_result' | 'reasoning'
  text: string
}

interface Props { entries: TraceEntry[]; active: boolean }

const KIND_STYLE: Record<string, string> = {
  tool_call:   'text-genomic-cyan',
  tool_result: 'text-genomic-amber/80',
  reasoning:   'text-white/70',
}

export default function ReasoningTrace({ entries, active }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  return (
    <div className="glass rounded-2xl p-4 h-full overflow-y-auto font-mono text-xs leading-relaxed">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-genomic-cyan animate-pulse' : 'bg-white/20'}`} />
        <span className="text-white/40 text-xs">Agent Reasoning</span>
      </div>
      <AnimatePresence initial={false}>
        {entries.map(e => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-1 ${KIND_STYLE[e.kind]}`}>
            {e.kind === 'tool_call'   && <span className="text-white/30 mr-1">▶</span>}
            {e.kind === 'tool_result' && <span className="text-white/30 mr-1">◀</span>}
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
      {active && <span className="inline-block w-1.5 h-4 bg-genomic-cyan animate-pulse ml-0.5" />}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: Write AnswerCard.tsx**

```tsx
// src/components/AnswerCard.tsx
import { motion } from 'framer-motion'

interface Props { answer: string; citations: string[] }

export default function AnswerCard({ answer, citations }: Props) {
  if (!answer) return null
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mt-4">
      <h3 className="text-genomic-cyan font-semibold text-sm mb-3">Answer</h3>
      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{answer}</p>
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs mb-2">Citations</p>
          <div className="flex flex-wrap gap-2">
            {citations.map(doi => (
              <a key={doi} href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer"
                className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan bg-genomic-cyan/10 px-2 py-1 rounded font-mono">
                {doi}
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/components/ReasoningTrace.tsx app/frontend/src/components/AnswerCard.tsx
git commit -m "feat: add ReasoningTrace and AnswerCard streaming components"
```

---

### Task 14: Ask page (the showpiece)

**Files:**
- Create: `app/frontend/src/pages/Ask.tsx`

- [ ] **Step 1: Write Ask.tsx**

```tsx
// src/pages/Ask.tsx
import { useState, useCallback, useId } from 'react'
import { motion } from 'framer-motion'
import { useSSE, type SSEEvent } from '../hooks/useSSE'
import { useGraph } from '../hooks/useGraph'
import KnowledgeGraph from '../components/KnowledgeGraph'
import ReasoningTrace, { type TraceEntry } from '../components/ReasoningTrace'
import AnswerCard from '../components/AnswerCard'
import type { GraphNode } from '../lib/api'

const EXAMPLE_QUESTIONS = [
  'What is the role of BRCA1 in hereditary breast cancer?',
  'How does CRISPR-Cas9 enable genome editing and what are its limitations?',
  'What genes are associated with colorectal cancer in recent genomics studies?',
]

export default function Ask() {
  const [question, setQuestion] = useState('')
  const [active, setActive] = useState(false)
  const [trace, setTrace] = useState<TraceEntry[]>([])
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const { nodes, edges, addNodes, addEdges, reset } = useGraph()
  const { stream, cancel } = useSSE()
  const uid = useId()
  let traceSeq = 0

  const handleEvent = useCallback((e: SSEEvent) => {
    if (e.type === 'reasoning') {
      setTrace(prev => {
        const last = prev[prev.length - 1]
        if (last?.kind === 'reasoning') {
          return [...prev.slice(0, -1), { ...last, text: last.text + (e.text as string) }]
        }
        return [...prev, { id: `${uid}-${traceSeq++}`, kind: 'reasoning', text: e.text as string }]
      })
    } else if (e.type === 'tool_call') {
      setTrace(prev => [...prev, { id: `${uid}-${traceSeq++}`, kind: 'tool_call', text: `${e.tool}(${JSON.stringify(e.input).slice(0, 60)}…)` }])
    } else if (e.type === 'tool_result') {
      setTrace(prev => [...prev, { id: `${uid}-${traceSeq++}`, kind: 'tool_result', text: (e.summary as string).slice(0, 120) }])
    } else if (e.type === 'graph_update') {
      addNodes(e.nodes as GraphNode[])
      addEdges(e.edges as any[])
    } else if (e.type === 'done') {
      setCitations(e.citations as string[])
      setActive(false)
    }
  }, [addNodes, addEdges, uid])

  const handleAsk = async () => {
    if (!question.trim() || active) return
    cancel()
    reset()
    setTrace([])
    setAnswer('')
    setCitations([])
    setActive(true)

    let answerBuf = ''
    await stream(
      'http://localhost:8000/ask',
      { question },
      (e) => {
        if (e.type === 'reasoning') answerBuf += e.text as string
        handleEvent(e)
      }
    )
    setAnswer(answerBuf)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Research Assistant</h1>
        <p className="text-white/50">Claude agent with hybrid search + live knowledge graph</p>
      </div>

      {/* Question input */}
      <div className="flex gap-3 mb-4">
        <input value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a genomics question…"
          className="flex-1 glass rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 border border-white/10 transition-colors" />
        <button onClick={handleAsk} disabled={active}
          className="px-6 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors">
          {active ? <span className="animate-pulse">Thinking…</span> : 'Ask'}
        </button>
      </div>

      {/* Example questions */}
      {!active && trace.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMPLE_QUESTIONS.map(q => (
            <button key={q} onClick={() => { setQuestion(q) }}
              className="text-xs glass px-3 py-2 rounded-lg text-white/60 hover:text-white transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Main split panel */}
      {(active || trace.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-4 h-[500px]">
          {/* Left: reasoning trace */}
          <ReasoningTrace entries={trace} active={active} />

          {/* Right: live knowledge graph */}
          <div className="glass rounded-2xl overflow-hidden relative">
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm font-mono">
                Graph building…
              </div>
            )}
            <KnowledgeGraph nodes={nodes} edges={edges} onNodeClick={setSelectedNode}
              className="w-full h-full" />
            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3 text-xs">
                <span className="font-semibold text-white">{selectedNode.label}</span>
                <span className="ml-2 text-white/40">{selectedNode.type}</span>
                <button onClick={() => setSelectedNode(null)} className="float-right text-white/30 hover:text-white">✕</button>
              </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 glass rounded-lg p-2 flex flex-col gap-1">
              {[['paper','#3b82f6'],['Gene','#10b981'],['Disease','#f43f5e'],['Chemical','#f59e0b']].map(([t,c]) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-white/60">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Answer */}
      <AnswerCard answer={answer} citations={citations} />
    </div>
  )
}
```

- [ ] **Step 2: Smoke test**

With backend running, navigate to `/ask`, type "What is BRCA1?" and submit. Verify:
- Reasoning trace streams in the left panel
- Graph nodes appear on the right as tools are called
- Answer appears below when done

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/pages/Ask.tsx
git commit -m "feat: add Ask page — streaming agent reasoning + live D3 knowledge graph"
```

---

### Task 15: Graph Explorer page

**Files:**
- Create: `app/frontend/src/pages/GraphExplorer.tsx`

- [ ] **Step 1: Write GraphExplorer.tsx**

```tsx
// src/pages/GraphExplorer.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { api, type SubgraphResponse, type GraphNode } from '../lib/api'
import KnowledgeGraph from '../components/KnowledgeGraph'
import EntityChip from '../components/EntityChip'

export default function GraphExplorer() {
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<SubgraphResponse>({ nodes: [], edges: [] })
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [loading, setLoading] = useState(false)

  const explore = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const names = query.split(',').map(s => s.trim()).filter(Boolean)
      const data = await api.subgraph(names)
      setGraph(data)
    } finally {
      setLoading(false)
    }
  }

  const entityNodes = graph.nodes.filter(n => n.type !== 'paper')
  const paperNodes = graph.nodes.filter(n => n.type === 'paper')

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Graph Explorer</h1>
      <p className="text-white/50 mb-8">Explore biomedical entity co-occurrence network. Enter comma-separated entity names.</p>

      <div className="flex gap-3 mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && explore()}
          placeholder="BRCA1, breast cancer, doxorubicin…"
          className="flex-1 glass rounded-xl px-5 py-3 text-white placeholder-white/30 focus:outline-none focus:border-genomic-cyan/60 border border-white/10" />
        <button onClick={explore} disabled={loading}
          className="px-5 py-3 bg-genomic-cyan text-navy-DEFAULT font-semibold rounded-xl hover:bg-genomic-cyan/90 disabled:opacity-50 transition-colors">
          {loading ? '…' : 'Explore'}
        </button>
      </div>

      {graph.nodes.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-4">
          <div className="col-span-2 glass rounded-2xl h-[600px] overflow-hidden">
            <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={setSelected} className="w-full h-full" />
          </div>
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-3">Summary</p>
              <p className="text-white text-sm">{graph.nodes.length} nodes · {graph.edges.length} edges</p>
              <p className="text-white/50 text-xs mt-1">{entityNodes.length} entities · {paperNodes.length} papers</p>
            </div>

            {selected && (
              <div className="glass rounded-2xl p-4">
                <p className="text-white/40 text-xs mb-2">Selected</p>
                <p className="font-semibold text-white">{selected.label}</p>
                <EntityChip name={selected.type} type={selected.type as any} />
              </div>
            )}

            <div className="glass rounded-2xl p-4 max-h-64 overflow-y-auto">
              <p className="text-white/40 text-xs mb-3">Entity nodes</p>
              <div className="flex flex-wrap gap-1.5">
                {entityNodes.map(n => (
                  <EntityChip key={n.id} name={n.label} type={n.type as any}
                    onClick={() => setSelected(n)} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/frontend/src/pages/GraphExplorer.tsx
git commit -m "feat: add Graph Explorer page with interactive entity subgraph"
```

---

### Task 16: Paper Detail page

**Files:**
- Create: `app/frontend/src/pages/PaperDetail.tsx`

- [ ] **Step 1: Write PaperDetail.tsx**

```tsx
// src/pages/PaperDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, type PaperDetail as PaperDetailType } from '../lib/api'
import EntityChip from '../components/EntityChip'

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>()
  const [paper, setPaper] = useState<PaperDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    api.paper(parseInt(id)).then(setPaper).catch(() => setPaper(null)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-32 text-genomic-cyan">Loading…</div>
  if (!paper) return <div className="text-center py-32 text-white/40">Paper not found. <Link to="/search" className="text-genomic-cyan">Back to search</Link></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white text-sm mb-6 flex items-center gap-2">
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-3">{paper.title}</h1>
      <p className="text-white/50 mb-2">{paper.authors}</p>
      <p className="text-white/30 text-sm mb-6">{paper.date}</p>

      <div className="flex gap-3 mb-8">
        {paper.doi && <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
          className="px-4 py-2 bg-genomic-cyan/20 text-genomic-cyan rounded-lg text-sm hover:bg-genomic-cyan/30 transition-colors">
          DOI: {paper.doi}
        </a>}
        {paper.url && <a href={paper.url} target="_blank" rel="noreferrer"
          className="px-4 py-2 glass rounded-lg text-sm hover:border-white/30 transition-colors">
          View on bioRxiv →
        </a>}
        <Link to={`/ask?q=${encodeURIComponent(`Tell me about: ${paper.title}`)}`}
          className="px-4 py-2 glass rounded-lg text-sm hover:border-genomic-cyan/40 text-genomic-cyan/80 transition-colors">
          Ask about this paper →
        </Link>
      </div>

      {paper.entities.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <p className="text-white/40 text-xs mb-3">Extracted entities</p>
          <div className="flex flex-wrap gap-2">
            {paper.entities.map((e, i) => (
              <EntityChip key={i} name={e.name} type={e.type as any} />
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-white/40 text-xs mb-3">Abstract</p>
        <p className="text-white/90 leading-relaxed">{paper.abstract}</p>
      </div>

      {paper.summary && (
        <div className="glass rounded-2xl p-6 border-l-2 border-genomic-cyan/40">
          <p className="text-white/40 text-xs mb-3">Summary</p>
          <p className="text-white/80 leading-relaxed">{paper.summary}</p>
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/frontend/src/pages/PaperDetail.tsx
git commit -m "feat: add Paper Detail page with entity chips and ask shortcut"
```

---

### Task 17: Cleanup + README update + final integration test

**Files:**
- Modify: `README.md`
- Create: `app/backend/data/.gitignore`

- [ ] **Step 1: Add .gitignore for generated cache**

```
# app/backend/data/.gitignore
entity_cache.json
```

- [ ] **Step 2: Run full integration smoke test**

Start backend:
```powershell
cd app\backend
python main.py
# Wait for "Ready."
```

Start frontend (new terminal):
```powershell
cd app\frontend
npm run dev
```

Manual checks:
- [ ] `http://localhost:5173` — Home loads, stats appear, DNA animation runs
- [ ] `/search` — type "CRISPR gene editing", results appear with scores
- [ ] `/ask` — type "What genes are associated with breast cancer?", verify reasoning trace streams, graph nodes appear, answer renders with DOIs
- [ ] Click a paper from search results → Paper Detail loads with entity chips
- [ ] `/explore` — type "BRCA1, breast cancer", graph renders

- [ ] **Step 3: Rewrite README.md**

```markdown
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

All source data is in `5_INFORMATION_RETRIEVAL/data/`. The backend reads it directly — no copy needed.
The entity cache (`app/backend/data/entity_cache.json`) is generated on first startup (~5 min) and reused on subsequent starts.
```

- [ ] **Step 4: Final commit**

```bash
git add README.md app/backend/data/.gitignore
git commit -m "docs: update README for new agentic RAG stack; add entity cache gitignore"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Replace TypeScript backend with Python FastAPI | Task 1 |
| FAISS + BM25 hybrid retrieval | Task 2 |
| RRF fusion | Task 2 |
| Cross-encoder reranking | Task 2 |
| scispaCy NER (en_ner_bc5cdr_md) | Task 3 |
| Entity cache persistence | Task 3 |
| NetworkX knowledge graph | Task 4 |
| Paper→Entity + Entity co-occurrence edges | Task 4 |
| 5 Claude tools | Task 5 |
| SSE streaming | Tasks 5, 6 |
| `/health`, `/stats`, `/search`, `/paper/:id`, `/entity/:name`, `/graph/subgraph`, `/graph/stats`, `/ask` | Task 6 |
| React 18 + Vite + TailwindCSS | Task 7 |
| Dark `#0a0f1e` theme, cyan/emerald/rose/amber accents, glassmorphism | Tasks 7–16 |
| Framer Motion animations | Tasks 10–16 |
| D3 force-directed graph | Task 12 |
| Streaming reasoning trace | Task 13 |
| Ask page split-panel layout | Task 14 |
| Live graph building during agent | Task 14 |
| Graph Explorer page | Task 15 |
| Paper Detail with entity chips | Task 16 |
| Home page with DNA animation + stats | Task 10 |
| Search page | Task 11 |
| Node colors: paper=blue, Gene=green, Disease=red, Chemical=amber | Task 12 |
| Replace Flask frontend | Task 1 |

All spec requirements covered. No TBDs or placeholders remain.

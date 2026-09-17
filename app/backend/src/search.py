from typing import TYPE_CHECKING

import faiss
import numpy as np
from rank_bm25 import BM25Okapi

from . import config
from .data_store import get_papers
from .models import SearchResult

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder, SentenceTransformer

_FAISS_PATH = config.FAISS_PATH
_EMBED_MODEL = config.EMBED_MODEL
_RERANK_MODEL = config.RERANK_MODEL
_RRF_K = config.RRF_K

_embedder: "SentenceTransformer | None" = None
_reranker: "CrossEncoder | None" = None
_faiss_index: faiss.Index | None = None
_bm25: BM25Okapi | None = None


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def load_search_indexes() -> None:
    global _embedder, _reranker, _faiss_index, _bm25
    # Lazy import to avoid DLL loading at collection time on Windows
    from sentence_transformers import CrossEncoder, SentenceTransformer
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

    fused = _rrf(faiss_ids, bm25_ids)[:max(10, top_k * 2)]
    candidate_ids = [doc_id for doc_id, _ in fused if doc_id < len(papers)]

    pairs = [(query, papers[i].abstract[:512]) for i in candidate_ids]
    rerank_scores = _reranker.predict(pairs)

    ranked = sorted(zip(candidate_ids, rerank_scores), key=lambda x: x[1], reverse=True)
    return [
        SearchResult(paper=papers[doc_id], score=float(score), rank=rank)
        for rank, (doc_id, score) in enumerate(ranked[:top_k])
    ]

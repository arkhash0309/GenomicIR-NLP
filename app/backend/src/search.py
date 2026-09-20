from typing import TYPE_CHECKING

import faiss

from . import config
from .data_store import get_papers
from .models import SearchResult
from .retrieval.bm25_index import BM25LexicalIndex
from .retrieval.faiss_store import FaissVectorStore
from .retrieval.interfaces import LexicalIndex, VectorStore

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder

_RRF_K = config.RRF_K

_reranker: "CrossEncoder | None" = None
_vector_store: VectorStore | None = None
_lexical_index: LexicalIndex | None = None


def load_search_indexes() -> None:
    global _reranker, _vector_store, _lexical_index
    # Lazy import to avoid DLL loading at collection time on Windows.
    from sentence_transformers import CrossEncoder, SentenceTransformer
    papers = get_papers()
    embedder = SentenceTransformer(config.EMBED_MODEL)
    _reranker = CrossEncoder(config.RERANK_MODEL)
    faiss_index = faiss.read_index(str(config.FAISS_PATH))
    _vector_store = FaissVectorStore(faiss_index, embedder)
    corpus = [p.title + " " + p.abstract for p in papers]
    _lexical_index = BM25LexicalIndex.build(corpus, cache_path=config.BM25_CACHE_PATH)


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
    n = min(config.RETRIEVAL_CANDIDATES, len(papers))

    faiss_ids = _vector_store.search(query, n)
    bm25_ids = _lexical_index.search(query, n)

    fused = _rrf(faiss_ids, bm25_ids)[:max(10, top_k * 2)]
    candidate_ids = [doc_id for doc_id, _ in fused if doc_id < len(papers)]

    pairs = [(query, papers[i].abstract[:config.RERANK_MAX_CHARS]) for i in candidate_ids]
    rerank_scores = _reranker.predict(pairs)

    ranked = sorted(zip(candidate_ids, rerank_scores), key=lambda x: x[1], reverse=True)
    return [
        SearchResult(paper=papers[doc_id], score=float(score), rank=rank)
        for rank, (doc_id, score) in enumerate(ranked[:top_k])
    ]

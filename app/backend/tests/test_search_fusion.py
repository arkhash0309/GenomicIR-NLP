from src import search


def test_rrf_prefers_docs_ranked_high_by_both():
    fused = search._rrf([5, 1, 2], [1, 9, 5])
    top = [doc for doc, _ in fused]
    assert top[0] in (1, 5)  # docs appearing in both lists rank first


def test_hybrid_search_uses_config_candidates(monkeypatch):
    calls = {}

    class _Store:
        def search(self, query, k):
            calls["k"] = k
            return [0, 1, 2]

    monkeypatch.setattr(search, "_vector_store", _Store())
    monkeypatch.setattr(search, "_lexical_index", _Store())
    monkeypatch.setattr(search.config, "RETRIEVAL_CANDIDATES", 7)

    class _Reranker:
        def predict(self, pairs):
            return [1.0 for _ in pairs]

    monkeypatch.setattr(search, "_reranker", _Reranker())

    from src.models import Paper
    monkeypatch.setattr(
        search, "get_papers",
        lambda: [Paper(id=i, title="t", authors="a", doi="d", date="", url="", abstract="x", summary="") for i in range(10)],
    )
    search.hybrid_search("q", top_k=2)
    assert calls["k"] == 7

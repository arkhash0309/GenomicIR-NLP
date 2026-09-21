from src.retrieval.bm25_index import BM25LexicalIndex, corpus_hash

DOCS = [
    "BRCA1 mutations in breast cancer tumor suppressor",
    "CRISPR Cas9 genome editing human cells",
    "RNA sequencing gene expression TP53 cancer",
]


def test_corpus_hash_is_stable_and_order_sensitive():
    assert corpus_hash(DOCS) == corpus_hash(list(DOCS))
    assert corpus_hash(DOCS) != corpus_hash(list(reversed(DOCS)))


def test_search_returns_relevant_doc_first():
    idx = BM25LexicalIndex.build(DOCS, cache_path=None)
    ids = idx.search("CRISPR genome editing", k=3)
    assert ids[0] == 1
    assert len(ids) == 3


def test_build_persists_and_reloads(tmp_path):
    cache = tmp_path / "bm25.pkl"
    BM25LexicalIndex.build(DOCS, cache_path=cache)
    assert cache.exists()
    # Reload path: same hash => object restored, still searchable.
    reloaded = BM25LexicalIndex.build(DOCS, cache_path=cache)
    assert reloaded.search("TP53 cancer", k=1) == [2]


def test_build_rebuilds_on_corpus_change(tmp_path):
    cache = tmp_path / "bm25.pkl"
    BM25LexicalIndex.build(DOCS, cache_path=cache)
    changed = DOCS + ["new document about proteomics"]
    idx = BM25LexicalIndex.build(changed, cache_path=cache)
    assert idx.search("proteomics", k=1) == [3]

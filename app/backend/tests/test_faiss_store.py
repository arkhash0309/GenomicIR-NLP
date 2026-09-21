import numpy as np

from src.retrieval.faiss_store import FaissVectorStore


class _FakeIndex:
    def search(self, vec, n):
        # Return fixed ids incl. a -1 sentinel to be filtered.
        ids = np.array([[2, 0, -1]])[:, :n]
        return np.zeros_like(ids, dtype="float32"), ids


class _FakeEmbedder:
    def encode(self, texts):
        return np.ones((len(texts), 4), dtype="float32")


def test_search_returns_ids_without_sentinels():
    store = FaissVectorStore(_FakeIndex(), _FakeEmbedder())
    ids = store.search("anything", k=3)
    assert ids == [2, 0]


def test_search_respects_k():
    store = FaissVectorStore(_FakeIndex(), _FakeEmbedder())
    assert store.search("anything", k=1) == [2]

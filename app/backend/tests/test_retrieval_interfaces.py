from src.retrieval.interfaces import LexicalIndex, VectorStore


class _Fake:
    def search(self, query: str, k: int) -> list[int]:
        return [0, 1][:k]


def test_fake_satisfies_vector_store():
    assert isinstance(_Fake(), VectorStore)


def test_fake_satisfies_lexical_index():
    assert isinstance(_Fake(), LexicalIndex)


def test_missing_search_fails_protocol():
    class NoSearch:
        pass
    assert not isinstance(NoSearch(), VectorStore)

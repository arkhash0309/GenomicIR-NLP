import pytest

from src.data_store import load_papers
from src.search import hybrid_search, load_search_indexes


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

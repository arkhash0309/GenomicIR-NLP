import pytest

from src import graph, ner
from src.models import Paper


def _papers():
    return [Paper(id=i, title=t, authors="", doi="", date="", url="", abstract="x", summary="")
            for i, t in enumerate(["A", "B"])]


def test_entity_cache_hash_changes_with_content():
    original_cache = dict(ner._entity_cache)
    try:
        ner._entity_cache.clear()
        ner._entity_cache.update({0: [{"name": "BRCA1", "type": "Gene"}]})
        h1 = ner.entity_cache_hash()
        ner._entity_cache.clear()
        ner._entity_cache.update({0: [{"name": "TP53", "type": "Gene"}]})
        assert ner.entity_cache_hash() != h1
    finally:
        ner._entity_cache.clear()
        ner._entity_cache.update(original_cache)


def test_build_saves_then_loads_from_cache(monkeypatch, tmp_path):
    original_cache = dict(ner._entity_cache)
    try:
        papers = _papers()
        monkeypatch.setattr(graph, "get_papers", lambda: papers)
        cache = tmp_path / "graph.pkl"
        monkeypatch.setattr(graph, "GRAPH_CACHE_PATH", cache)
        ner._entity_cache.clear()
        ner._entity_cache.update({
            0: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
            1: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        })
        graph.build_graph()
        assert cache.exists()

        # Corrupt in-memory state, then rebuild: must restore from disk (same hash).
        graph._entity_nodes = []
        graph._entity_papers = {}
        graph.build_graph()
        assert set(graph.get_papers_by_entity("brca1")) == {0, 1}
    finally:
        # Restore original state
        ner._entity_cache.clear()
        ner._entity_cache.update(original_cache)
        # Reset graph to clean state so it doesn't interfere with other tests
        graph._G = None
        graph._entity_nodes = []
        graph._entity_papers = {}

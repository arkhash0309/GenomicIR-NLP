import pytest

from src import graph, ner
from src.models import Paper


@pytest.fixture(autouse=True)
def build(monkeypatch):
    papers = [Paper(id=i, title=t, authors="", doi="", date="", url="", abstract="x", summary="")
              for i, t in enumerate(["A", "B"])]
    monkeypatch.setattr(graph, "get_papers", lambda: papers)
    monkeypatch.setattr(graph, "GRAPH_CACHE_PATH", None)
    ner._entity_cache.clear()
    ner._entity_cache.update({
        0: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
    })
    graph.build_graph()
    yield
    # Cleanup: reset graph state after test
    graph._G = None
    graph._entity_nodes = []
    graph._entity_papers = {}


def test_lookup_uses_index_not_paper_scan():
    ids = graph.get_papers_by_entity("brca1")
    assert set(ids) == {0, 1}


def test_lookup_substring_match():
    assert set(graph.get_papers_by_entity("cancer")) == {0, 1}


def test_connections_via_index():
    conns = graph.get_entity_connections("brca1")
    assert any(c["name"].lower() == "breast cancer" for c in conns)

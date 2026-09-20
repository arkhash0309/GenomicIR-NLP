import pytest

from src import graph
from src.models import Paper


@pytest.fixture(autouse=True)
def build(monkeypatch):
    from src import data_store as ds
    from src import ner
    papers = [
        Paper(id=0, title="A", authors="", doi="", date="", url="", abstract="x", summary=""),
        Paper(id=1, title="B", authors="", doi="", date="", url="", abstract="x", summary=""),
        Paper(id=2, title="C", authors="", doi="", date="", url="", abstract="x", summary=""),
    ]
    monkeypatch.setattr(ds, "_papers", papers)
    monkeypatch.setattr(graph, "get_papers", lambda: papers)
    monkeypatch.setattr(graph, "GRAPH_CACHE_PATH", None)  # disable persistence here
    original_cache = ner._entity_cache.copy()
    ner._entity_cache.clear()
    ner._entity_cache.update({
        0: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        2: [{"name": "BRCA1", "type": "Gene"}, {"name": "TP53", "type": "Gene"}],
    })
    graph.build_graph()
    yield
    ner._entity_cache.clear()
    ner._entity_cache.update(original_cache)


def test_cooccurrence_edge_weight_equals_shared_papers():
    # BRCA1 and breast cancer share papers 0 and 1 => weight 2.
    conns = graph.get_entity_connections("BRCA1")
    disease = next(c for c in conns if c["name"].lower() == "breast cancer")
    assert disease["weight"] == 2


def test_no_edge_below_threshold():
    # BRCA1 and TP53 share only paper 2 => below COOCCURRENCE_MIN, no edge.
    conns = graph.get_entity_connections("BRCA1")
    assert all(c["name"].lower() != "tp53" for c in conns)


def test_entity_index_populated():
    assert any("brca1" in k for k in graph._entity_nodes)
    assert 0 in graph._entity_papers["Gene:brca1"]
    assert 1 in graph._entity_papers["Gene:brca1"]

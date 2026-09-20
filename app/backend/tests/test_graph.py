import pytest

from src import graph
from src.graph import build_graph, get_entity_connections, get_papers_by_entity, get_subgraph, graph_stats
from src.models import Paper
from src.ner import _entity_cache


@pytest.fixture(scope="module")
def mock_papers():
    return [
        Paper(id=0, title="BRCA1 mutations in breast cancer", authors="Smith J",
              doi="10.1000/test.001", date="2023-01", url="https://example.com/1",
              abstract="BRCA1 is a tumor suppressor gene associated with hereditary breast and ovarian cancer.",
              summary="BRCA1 mutations increase cancer risk."),
        Paper(id=1, title="CRISPR-Cas9 genome editing in human cells", authors="Jones A",
              doi="10.1000/test.002", date="2023-02", url="https://example.com/2",
              abstract="CRISPR-Cas9 enables precise genome editing in human cells.",
              summary="CRISPR enables genome editing."),
        Paper(id=2, title="RNA sequencing reveals gene expression patterns", authors="Lee B",
              doi="10.1000/test.003", date="2023-03", url="https://example.com/3",
              abstract="RNA sequencing analysis reveals complex gene expression patterns in cancer cells.",
              summary="RNA-seq reveals cancer gene expression."),
    ]


@pytest.fixture(scope="module", autouse=True)
def setup(mock_papers):
    original_cache = dict(_entity_cache)
    graph.GRAPH_CACHE_PATH = None
    _entity_cache.clear()
    _entity_cache.update({
        0: [{"name": "BRCA1", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "CRISPR-Cas9", "type": "Chemical"}, {"name": "genome editing", "type": "Gene"}],
        2: [{"name": "TP53", "type": "Gene"}, {"name": "breast cancer", "type": "Disease"}],
    })
    from src import data_store as ds
    ds._papers = mock_papers
    build_graph()
    yield
    # Cleanup
    _entity_cache.clear()
    _entity_cache.update(original_cache)
    graph._G = None
    graph._entity_nodes = []
    graph._entity_papers = {}


def test_graph_stats_has_keys():
    stats = graph_stats()
    assert "paper_count" in stats
    assert "entity_count" in stats
    assert "edge_count" in stats


def test_get_papers_by_entity_finds_papers():
    ids = get_papers_by_entity("breast cancer")
    assert 0 in ids
    assert 2 in ids


def test_get_entity_connections_returns_list():
    conns = get_entity_connections("BRCA1")
    assert isinstance(conns, list)


def test_get_subgraph_returns_nodes_and_edges():
    result = get_subgraph(["breast cancer"])
    assert len(result.nodes) > 0


def test_get_subgraph_node_types_valid():
    result = get_subgraph(["BRCA1", "breast cancer"])
    valid_types = {"paper", "Gene", "Disease", "Chemical"}
    for node in result.nodes:
        assert node.type in valid_types

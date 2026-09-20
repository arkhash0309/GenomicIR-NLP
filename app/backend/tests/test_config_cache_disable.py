import importlib


def test_graph_cache_path_none_disables(monkeypatch):
    monkeypatch.setenv("GRAPH_CACHE_PATH", "None")
    from src import config
    importlib.reload(config)
    assert config.GRAPH_CACHE_PATH is None


def test_bm25_cache_path_none_disables(monkeypatch):
    monkeypatch.setenv("BM25_CACHE_PATH", "none")
    from src import config
    importlib.reload(config)
    assert config.BM25_CACHE_PATH is None


def test_graph_cache_path_default_is_path(monkeypatch):
    monkeypatch.delenv("GRAPH_CACHE_PATH", raising=False)
    from src import config
    importlib.reload(config)
    assert config.GRAPH_CACHE_PATH is not None
    assert config.GRAPH_CACHE_PATH.name == "graph.pkl"

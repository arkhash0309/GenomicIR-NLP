import importlib


def test_retrieval_defaults(monkeypatch):
    monkeypatch.delenv("RETRIEVAL_CANDIDATES", raising=False)
    monkeypatch.delenv("RERANK_MAX_CHARS", raising=False)
    from src import config
    importlib.reload(config)
    assert config.RETRIEVAL_CANDIDATES == 20
    assert config.RERANK_MAX_CHARS == 512
    assert config.BM25_CACHE_PATH.name == "bm25_index.pkl"


def test_retrieval_env_override(monkeypatch):
    monkeypatch.setenv("RETRIEVAL_CANDIDATES", "50")
    monkeypatch.setenv("RERANK_MAX_CHARS", "1024")
    from src import config
    importlib.reload(config)
    assert config.RETRIEVAL_CANDIDATES == 50
    assert config.RERANK_MAX_CHARS == 1024

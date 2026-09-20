import importlib


def test_graph_defaults(monkeypatch):
    for var in ("NER_MAX_CHARS", "ENTITY_ALIAS_PATH", "COOCCURRENCE_MIN"):
        monkeypatch.delenv(var, raising=False)
    from src import config
    importlib.reload(config)
    assert config.NER_MAX_CHARS == 2000
    assert config.ENTITY_ALIAS_PATH is None
    assert config.COOCCURRENCE_MIN == 2
    assert config.GRAPH_CACHE_PATH.name == "graph.pkl"


def test_graph_env_override(monkeypatch, tmp_path):
    monkeypatch.setenv("NER_MAX_CHARS", "5000")
    monkeypatch.setenv("COOCCURRENCE_MIN", "3")
    alias = tmp_path / "aliases.json"
    alias.write_text("{}")
    monkeypatch.setenv("ENTITY_ALIAS_PATH", str(alias))
    from src import config
    importlib.reload(config)
    assert config.NER_MAX_CHARS == 5000
    assert config.COOCCURRENCE_MIN == 3
    assert config.ENTITY_ALIAS_PATH == alias.resolve()

import json

from src import ner


def test_normalize_name_collapses_whitespace():
    assert ner.normalize_name("  Breast   Cancer ") == "breast cancer"


def test_canonicalize_without_aliases_returns_trimmed(monkeypatch):
    monkeypatch.setattr(ner, "_aliases", {})
    assert ner.canonicalize_entity("  TP53 ") == "TP53"


def test_canonicalize_maps_alias(monkeypatch):
    monkeypatch.setattr(ner, "_aliases", {"p53": "TP53"})
    assert ner.canonicalize_entity("p53") == "TP53"
    assert ner.canonicalize_entity("P53") == "TP53"  # normalized lookup


def test_load_aliases_reads_and_normalizes_keys(monkeypatch, tmp_path):
    path = tmp_path / "aliases.json"
    path.write_text(json.dumps({"P53": "TP53", " HER2 ": "ERBB2"}))
    monkeypatch.setattr(ner.config, "ENTITY_ALIAS_PATH", path)
    aliases = ner.load_aliases()
    assert aliases["p53"] == "TP53"
    assert aliases["her2"] == "ERBB2"

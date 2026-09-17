import pytest

from src.ner import build_entity_cache, extract_entities_from_text, get_paper_entities, load_ner


@pytest.fixture(scope="module", autouse=True)
def setup_ner():
    load_ner()


def test_extract_disease_entity():
    entities = extract_entities_from_text("Patients with breast cancer showed BRCA1 mutations.")
    types = [e["type"] for e in entities]
    assert "Disease" in types


def test_extract_chemical_entity():
    entities = extract_entities_from_text("Treatment with doxorubicin reduced tumor size.")
    types = [e["type"] for e in entities]
    assert "Chemical" in types


def test_extract_gene_entity():
    entities = extract_entities_from_text("Expression of TP53 mRNA was significantly reduced.")
    types = [e["type"] for e in entities]
    assert "Gene" in types


def test_entity_has_name_and_type(tmp_path, mock_papers, monkeypatch):
    from src import ner as ner_module
    monkeypatch.setattr(ner_module, "CACHE_PATH", tmp_path / "entity_cache.json")
    monkeypatch.setattr(ner_module, "_entity_cache", {})
    monkeypatch.setattr(ner_module, "_cache_loaded", False)
    build_entity_cache(mock_papers)
    entities = get_paper_entities(0)
    assert len(entities) > 0
    for e in entities:
        assert "name" in e
        assert e["type"] in ("Gene", "Disease", "Chemical")


def test_entity_cache_persists(tmp_path, mock_papers, monkeypatch):
    from src import ner as ner_module
    monkeypatch.setattr(ner_module, "CACHE_PATH", tmp_path / "entity_cache.json")
    monkeypatch.setattr(ner_module, "_entity_cache", {})
    monkeypatch.setattr(ner_module, "_cache_loaded", False)
    build_entity_cache(mock_papers)
    assert (tmp_path / "entity_cache.json").exists()

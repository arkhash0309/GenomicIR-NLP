import pytest
from src.models import Paper


def test_paper_model_validates():
    p = Paper(id=0, title="Test", authors="A", doi="10.0/x", date="2023", url="http://x", abstract="abs", summary="sum")
    assert p.id == 0
    assert p.title == "Test"


def test_load_papers_returns_nonempty_list(loaded_papers):
    assert len(loaded_papers) > 100


def test_paper_has_required_fields(loaded_papers):
    p = loaded_papers[0]
    assert p.title
    assert p.abstract
    assert isinstance(p.id, int)


def test_get_paper_by_id(loaded_papers):
    from src.data_store import get_paper_by_id
    p = get_paper_by_id(0)
    assert p is not None
    assert p.id == 0


def test_get_paper_by_id_out_of_range(loaded_papers):
    from src.data_store import get_paper_by_id
    assert get_paper_by_id(999999) is None

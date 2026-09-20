import json

from src import agent


def test_papers_from_hybrid_search():
    result = json.dumps([{"id": 3, "title": "T", "doi": "10.1000/x", "score": 1.0}])
    papers = agent._papers_from_tool_result("hybrid_search", result)
    assert papers == [{"doi": "10.1000/x", "title": "T", "paper_id": 3}]


def test_papers_from_paper_details():
    result = json.dumps({"id": 5, "title": "Deep", "doi": "10.1000/y", "abstract": "..."})
    papers = agent._papers_from_tool_result("get_paper_details", result)
    assert papers == [{"doi": "10.1000/y", "title": "Deep", "paper_id": 5}]


def test_papers_from_malformed_result_is_empty():
    assert agent._papers_from_tool_result("hybrid_search", "not json") == []


def test_build_citations_separates_verified_and_unverified():
    retrieved = {"10.1000/x": {"doi": "10.1000/x", "title": "T", "paper_id": 3}}
    text = "Evidence in [Author, 10.1000/x] but also 10.1000/hallucinated."
    citations, unverified = agent._build_citations(text, retrieved)
    assert citations == [{"doi": "10.1000/x", "title": "T", "paper_id": 3}]
    assert unverified == ["10.1000/hallucinated"]

from eval.dataset import GoldItem, load_gold


def test_load_gold_parses_jsonl(tmp_path):
    p = tmp_path / "gold.jsonl"
    p.write_text(
        '{"query": "BRCA1 and breast cancer", "relevant_dois": ["10.1/a", "10.1/b"]}\n'
        '\n'
        '{"query": "CRISPR editing", "relevant_dois": ["10.2/c"], "reference_answer": "CRISPR edits DNA."}\n'
    )
    items = load_gold(p)
    assert len(items) == 2
    assert isinstance(items[0], GoldItem)
    assert items[0].relevant_dois == ["10.1/a", "10.1/b"]
    assert items[0].reference_answer is None
    assert items[1].reference_answer == "CRISPR edits DNA."


def test_gold_item_defaults():
    item = GoldItem(query="q", relevant_dois=["10.1/x"])
    assert item.reference_answer is None

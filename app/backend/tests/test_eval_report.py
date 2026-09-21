from eval.report import render_markdown


def test_render_markdown_contains_metrics():
    report = {"k": 10, "n": 2, "skipped": 0,
              "recall_at_k": 0.75, "mrr": 0.5, "ndcg_at_k": 0.6, "per_query": []}
    md = render_markdown(report)
    assert "recall@10" in md.lower() or "recall@k" in md.lower()
    assert "0.75" in md
    assert "0.5" in md

from eval.dataset import GoldItem
from eval.retrieval_eval import evaluate_retrieval


def _fake_search(query, k):
    table = {
        "q1": ["10.1/a", "10.1/b", "10.1/c"],
        "q2": ["10.2/x", "10.2/y"],
    }
    return table.get(query, [])[:k]


def test_evaluate_retrieval_aggregates():
    gold = [
        GoldItem(query="q1", relevant_dois=["10.1/a"]),      # perfect rank-1
        GoldItem(query="q2", relevant_dois=["10.2/y"]),      # rank-2
    ]
    report = evaluate_retrieval(gold, _fake_search, k=3)
    assert report["n"] == 2
    assert report["recall_at_k"] == 1.0     # both relevant docs retrieved within k
    assert report["mrr"] == 0.75            # (1.0 + 0.5) / 2
    assert len(report["per_query"]) == 2


def test_evaluate_retrieval_skips_empty_relevant():
    gold = [GoldItem(query="q1", relevant_dois=[]),
            GoldItem(query="q2", relevant_dois=["10.2/x"])]
    report = evaluate_retrieval(gold, _fake_search, k=3)
    assert report["n"] == 1
    assert report["skipped"] == 1

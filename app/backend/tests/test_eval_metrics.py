import math

from eval.metrics import ndcg_at_k, recall_at_k, reciprocal_rank


def test_recall_at_k():
    assert recall_at_k(["a", "b", "c"], ["b", "z"], k=3) == 0.5
    assert recall_at_k(["a", "b"], ["b"], k=1) == 0.0   # b not in top-1
    assert recall_at_k(["a"], [], k=3) == 0.0           # no relevant


def test_reciprocal_rank():
    assert reciprocal_rank(["a", "b", "c"], ["b"]) == 0.5   # first relevant at rank 2
    assert reciprocal_rank(["a", "b"], ["x"]) == 0.0
    assert reciprocal_rank(["a"], []) == 0.0


def test_ndcg_at_k_perfect_is_one():
    assert ndcg_at_k(["a", "b"], ["a", "b"], k=2) == 1.0


def test_ndcg_at_k_ranking_matters():
    good = ndcg_at_k(["a", "x", "y"], ["a"], k=3)     # relevant at pos 0
    worse = ndcg_at_k(["x", "y", "a"], ["a"], k=3)    # relevant at pos 2
    assert good > worse
    assert math.isclose(good, 1.0)

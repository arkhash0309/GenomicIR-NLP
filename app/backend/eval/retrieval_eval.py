from __future__ import annotations

from typing import Callable

from .dataset import GoldItem
from .metrics import ndcg_at_k, recall_at_k, reciprocal_rank


def evaluate_retrieval(
    gold: list[GoldItem],
    search_fn: Callable[[str, int], list[str]],
    k: int = 10,
) -> dict:
    per_query = []
    recalls, rrs, ndcgs = [], [], []
    skipped = 0
    for item in gold:
        if not item.relevant_dois:
            skipped += 1
            continue
        retrieved = search_fn(item.query, k)
        r = recall_at_k(retrieved, item.relevant_dois, k)
        rr = reciprocal_rank(retrieved, item.relevant_dois)
        nd = ndcg_at_k(retrieved, item.relevant_dois, k)
        recalls.append(r)
        rrs.append(rr)
        ndcgs.append(nd)
        per_query.append({"query": item.query, "recall_at_k": r, "rr": rr, "ndcg_at_k": nd})

    def _mean(xs: list[float]) -> float:
        return sum(xs) / len(xs) if xs else 0.0

    return {
        "k": k,
        "n": len(per_query),
        "skipped": skipped,
        "recall_at_k": _mean(recalls),
        "mrr": _mean(rrs),
        "ndcg_at_k": _mean(ndcgs),
        "per_query": per_query,
    }

from __future__ import annotations

import math


def recall_at_k(retrieved: list[str], relevant: list[str], k: int) -> float:
    rel = set(relevant)
    if not rel:
        return 0.0
    hits = sum(1 for doc in retrieved[:k] if doc in rel)
    return hits / len(rel)


def reciprocal_rank(retrieved: list[str], relevant: list[str]) -> float:
    rel = set(relevant)
    if not rel:
        return 0.0
    for i, doc in enumerate(retrieved):
        if doc in rel:
            return 1.0 / (i + 1)
    return 0.0


def ndcg_at_k(retrieved: list[str], relevant: list[str], k: int) -> float:
    rel = set(relevant)
    if not rel:
        return 0.0
    dcg = sum(1.0 / math.log2(i + 2) for i, doc in enumerate(retrieved[:k]) if doc in rel)
    ideal_hits = min(k, len(rel))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg else 0.0

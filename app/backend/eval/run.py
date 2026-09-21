from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .dataset import load_gold
from .report import render_markdown
from .retrieval_eval import evaluate_retrieval

_DEFAULT_GOLD = Path(__file__).resolve().parent / "data" / "sample_gold.jsonl"


def _default_search_fn(query: str, k: int) -> list[str]:
    # Lazy import so pure-metric tests never pull in FAISS/sentence-transformers.
    from src.data_store import load_papers
    from src.search import hybrid_search, load_search_indexes
    if not getattr(_default_search_fn, "_ready", False):
        load_papers()
        load_search_indexes()
        _default_search_fn._ready = True  # type: ignore[attr-defined]
    return [r.paper.doi for r in hybrid_search(query, top_k=k)]


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Evaluate retrieval quality.")
    parser.add_argument("--gold", default=str(_DEFAULT_GOLD))
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--out")
    parser.add_argument("--judge", action="store_true")
    args = parser.parse_args(argv)

    gold = load_gold(args.gold)
    if all(not g.relevant_dois for g in gold):
        print("WARNING: no gold DOIs set — metrics will be 0. "
              "Populate relevant_dois in your gold file.", file=sys.stderr)

    report = evaluate_retrieval(gold, _default_search_fn, k=args.k)
    print(render_markdown(report))

    if args.judge:
        print("NOTE: --judge requires ANTHROPIC_API_KEY and reference contexts; "
              "see eval/judge.py.", file=sys.stderr)

    if args.out:
        Path(args.out).write_text(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

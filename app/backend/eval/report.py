from __future__ import annotations


def render_markdown(report: dict) -> str:
    k = report["k"]
    lines = [
        "# Retrieval evaluation",
        "",
        f"Scored queries: {report['n']} (skipped {report.get('skipped', 0)} without gold DOIs)",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| recall@{k} | {report['recall_at_k']:.4f} |",
        f"| MRR | {report['mrr']:.4f} |",
        f"| nDCG@{k} | {report['ndcg_at_k']:.4f} |",
    ]
    return "\n".join(lines)

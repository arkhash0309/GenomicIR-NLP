#!/usr/bin/env python
"""Build a small, self-contained sample corpus from the full dataset.

The full corpus (~50 MB of metadata + FAISS index) is great for the live demo
but heavy to clone and slow to boot. This script carves out a tiny slice so you
can start the whole stack in seconds — and it doubles as a worked example of the
"bring your own corpus" flow: swap the source files below for your own papers and
you get a matching FAISS index for free.

Usage:
    python scripts/build_sample_dataset.py --n 50 --out data/sample

Then point the backend at it:
    DATA_DIR=data/sample/data
    EMBEDDINGS_DIR=data/sample/embeddings

(see .env.example). The embedding model and content fields mirror the original
index build in pipeline/5_INFORMATION_RETRIEVAL, so retrieval behaves the same —
just over fewer papers.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# Mirrors pipeline/5_INFORMATION_RETRIEVAL/data/config.yaml
EMBED_MODEL = "all-MiniLM-L6-v2"
CONTENT_FIELDS = ["Title", "Abstract", "Summary"]

SRC_META = REPO_ROOT / "pipeline" / "5_INFORMATION_RETRIEVAL" / "data" / "metadata.pkl"
SRC_CSV = REPO_ROOT / "pipeline" / "5_INFORMATION_RETRIEVAL" / "data" / "papers_combined_with_abstract_and_summary.csv"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a sample corpus + FAISS index.")
    parser.add_argument("--n", type=int, default=50, help="Number of papers to keep (default: 50).")
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "data" / "sample",
                        help="Output directory (default: data/sample).")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for sampling.")
    args = parser.parse_args()

    try:
        import numpy as np
        import pandas as pd
        import faiss
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:  # pragma: no cover - dependency hint
        print(f"Missing dependency: {exc}. Install with: pip install -r app/backend/requirements.txt",
              file=sys.stderr)
        return 1

    if not SRC_META.exists() or not SRC_CSV.exists():
        print(f"Source data not found. Expected:\n  {SRC_META}\n  {SRC_CSV}", file=sys.stderr)
        return 1

    print(f"Loading full corpus from {SRC_META.name} ...")
    meta = pd.read_pickle(SRC_META).reset_index(drop=True)
    csv = pd.read_csv(SRC_CSV)

    n = min(args.n, len(meta))
    sample = meta.sample(n=n, random_state=args.seed).reset_index(drop=True)
    print(f"Sampled {n} of {len(meta)} papers (seed={args.seed}).")

    # Rebuild the 'content' field exactly as the original index did, then embed.
    for field in CONTENT_FIELDS:
        if field not in sample.columns:
            sample[field] = ""
    content = sample[CONTENT_FIELDS].fillna("").agg(". ".join, axis=1).tolist()

    print(f"Embedding with {EMBED_MODEL} ...")
    model = SentenceTransformer(EMBED_MODEL)
    embeddings = model.encode(content, show_progress_bar=True)

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings, dtype="float32"))

    data_dir = args.out / "data"
    emb_dir = args.out / "embeddings"
    data_dir.mkdir(parents=True, exist_ok=True)
    emb_dir.mkdir(parents=True, exist_ok=True)

    sample.to_pickle(data_dir / "metadata.pkl")
    # Keep only the CSV rows whose titles survive, so the summary lookup still resolves.
    titles = set(sample["Title"].astype(str).str.strip())
    csv[csv["Title"].astype(str).str.strip().isin(titles)].to_csv(
        data_dir / "papers_combined_with_abstract_and_summary.csv", index=False
    )
    faiss.write_index(index, str(emb_dir / "papers_index.faiss"))

    print("\nSample dataset written to:")
    print(f"  {data_dir}")
    print(f"  {emb_dir}")
    print("\nPoint the backend at it via .env:")
    print(f"  DATA_DIR={data_dir}")
    print(f"  EMBEDDINGS_DIR={emb_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

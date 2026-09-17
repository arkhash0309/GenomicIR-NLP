# Data pipeline

This directory documents **how the corpus that powers the app was built**. It is
separate from the application in [`app/`](../app) on purpose: the app reads the
finished artifacts (a metadata table + a FAISS index), while this pipeline shows
the journey from raw papers to those artifacts.

You do **not** need to run any of this to run the app — the prepared data ships in
[`5_INFORMATION_RETRIEVAL/`](5_INFORMATION_RETRIEVAL). It's here for reproducibility
and as a reference if you want to build a corpus of your own.

## Stages

| Stage | Directory | What it does |
|---|---|---|
| 1 · Web scraping | `1_WEB_SCRAPING/` | Crawl bioRxiv genomics paper metadata. |
| 2 · Data store | `2_DATA_STORE/` | Consolidate crawled records. |
| 3 · Summarization | `3_SUMMARIZATION_MODEL/` | Fine-tuned T5 abstract summaries. |
| 4 · QA bot | `4_QA_BOT/` | Early abstract crawl + retrieval experiments. |
| 5 · Information retrieval | `5_INFORMATION_RETRIEVAL/` | Merge data, embed, and build the FAISS index the app consumes. |

## Artifacts the app consumes

From `5_INFORMATION_RETRIEVAL/`:

- `data/metadata.pkl` — paper metadata, in the same row order as the FAISS index.
- `data/papers_combined_with_abstract_and_summary.csv` — provides the summary field.
- `embeddings/papers_index.faiss` — the semantic search index.

The backend resolves these paths via `DATA_DIR` / `EMBEDDINGS_DIR` (see the root
[`.env.example`](../.env.example)), so you can override them to point at your own data.

## Rebuilding the index

`5_INFORMATION_RETRIEVAL/prepare_index.py` rebuilds the FAISS index and metadata from a
source CSV using the embedding model and content fields defined in
`5_INFORMATION_RETRIEVAL/data/config.yaml`. For a small, self-contained example of the same
idea, see [`scripts/build_sample_dataset.py`](../scripts/build_sample_dataset.py).

# Evaluation harness

This module provides a retrieval quality evaluation suite for GenomicIR-NLP, with pure metrics (recall@k, MRR, nDCG@k) and an optional answer-faithfulness judge powered by Claude.

## Gold dataset format

Evaluation requires a **gold JSONL** file where each line is a JSON object with:

```json
{
  "query": "What genes are associated with breast cancer risk?",
  "relevant_dois": ["10.1101/2023.01.01.001", "10.1101/2023.01.02.002"],
  "reference_answer": "Optional: the correct answer to the query for faithfulness grading."
}
```

**Fields:**
- `query` (string, required): The search query to evaluate.
- `relevant_dois` (list[string]): DOIs of papers known to answer the query. If empty, the query is skipped during evaluation.
- `reference_answer` (string, optional): A gold-standard answer, used with `--judge` to grade faithfulness.

## Populating `relevant_dois` from `/search` results

When building a gold dataset:

1. **Run the app** locally with your corpus:
   ```bash
   make backend  # or docker compose up
   ```

2. **Query the `/search` endpoint** for each query:
   ```bash
   curl http://localhost:8000/search -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"What genes are associated with breast cancer risk?","top_k":20}'
   ```

3. **Review the results** and copy the DOIs of truly relevant papers into `relevant_dois`:
   ```json
   {
     "query": "What genes are associated with breast cancer risk?",
     "relevant_dois": [
       "10.1101/2023.01.01.001",
       "10.1101/2023.01.02.002"
     ]
   }
   ```

4. **Build your gold file** (JSONL, one query per line) and place it in `eval/data/` or a custom path.

## Running evaluation

### Quick start — sample gold set

```bash
make eval
```

This runs `python -m eval.run --gold eval/data/sample_gold.jsonl --k 10`, which:
- Loads the bundled sample queries from `eval/data/sample_gold.jsonl`.
- For each query with `relevant_dois`, retrieves the top-10 results using hybrid search.
- Computes recall@10, MRR, and nDCG@10.
- Prints a markdown table and per-query scores.

### Custom gold file

```bash
python -m eval.run --gold path/to/my_gold.jsonl --k 10
```

### Save results as JSON

```bash
python -m eval.run --gold eval/data/sample_gold.jsonl --k 10 --out results.json
```

The JSON output includes `k`, `n` (queries scored), `skipped` (no gold DOIs), and per-query breakdowns:

```json
{
  "k": 10,
  "n": 45,
  "skipped": 2,
  "recall_at_k": 0.6234,
  "mrr": 0.4567,
  "ndcg_at_k": 0.5123,
  "per_query": [
    {
      "query": "What genes are associated with breast cancer risk?",
      "recall_at_k": 0.75,
      "rr": 0.5,
      "ndcg_at_k": 0.6234
    },
    ...
  ]
}
```

## Interpreting metrics

- **recall@k** (0–1): Fraction of relevant papers that appear in the top-k results. Higher is better.
  - Example: recall@10 = 0.75 means the retriever found 75% of the known relevant papers in the top 10.

- **MRR** (Mean Reciprocal Rank, 0–1): Average of 1 / rank of the first relevant result per query.
  - Example: MRR = 0.5 means on average, the first relevant paper is at rank 2.
  - Penalizes slow-to-retrieve papers; favors early hits.

- **nDCG@k** (Normalized Discounted Cumulative Gain, 0–1): Position-weighted measure of ranking quality.
  - Rewards relevant papers at higher ranks (using log2 discount).
  - nDCG@10 = 0.8 indicates strong ranking; 0.5 is moderate.

## Optional: answer-faithfulness judge

For end-to-end evaluation of the agent's **answers** (not just retrieval), use the `--judge` flag:

```bash
ANTHROPIC_API_KEY="sk-..." python -m eval.run --gold eval/data/sample_gold.jsonl --judge
```

**Requirements:**
- `ANTHROPIC_API_KEY` environment variable set to a valid Anthropic API key.
- Each query in the gold file must have `reference_answer`.
- The retrieval results are used as source contexts for grading.

The judge evaluates two dimensions:
1. **Faithfulness** (0–1): Fraction of the answer's claims supported by the source contexts.
2. **Citation accuracy** (0–1): Fraction of cited papers that actually support the claim.

Scores and notes are printed per query and stored in the report JSON.

**See also:** `eval/judge.py` for the grading prompt and response parsing.

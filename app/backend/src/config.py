"""Central configuration for the backend.

Every value is read from an environment variable with a default that reproduces
the original behaviour, so the app runs unchanged out of the box while remaining
fully re-targetable at a different corpus, model, or deployment. Nothing here
changes application logic — it only lifts previously hard-coded constants into
one place you can override with a `.env` file.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Repo root: app/backend/src/config.py -> parents[3] == repo root
REPO_ROOT = Path(__file__).resolve().parents[3]

# Load environment before reading any settings below. Real environment variables
# (e.g. those injected by Docker) always win, since load_dotenv does not override.
load_dotenv(REPO_ROOT / ".env")
load_dotenv(REPO_ROOT / "app" / "backend" / ".env")
load_dotenv()


def _path(env_var: str, default: Path) -> Path:
    raw = os.getenv(env_var)
    return Path(raw).expanduser().resolve() if raw else default


def _split(env_var: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(env_var, default).split(",") if item.strip()]


# --- Data sources -----------------------------------------------------------
# Point DATA_DIR / EMBEDDINGS_DIR at your own corpus to re-use the whole stack.
DATA_DIR = _path("DATA_DIR", REPO_ROOT / "pipeline" / "5_INFORMATION_RETRIEVAL" / "data")
EMBEDDINGS_DIR = _path("EMBEDDINGS_DIR", REPO_ROOT / "pipeline" / "5_INFORMATION_RETRIEVAL" / "embeddings")

METADATA_PATH = _path("METADATA_PATH", DATA_DIR / "metadata.pkl")
CSV_PATH = _path("CSV_PATH", DATA_DIR / "papers_combined_with_abstract_and_summary.csv")
FAISS_PATH = _path("FAISS_PATH", EMBEDDINGS_DIR / "papers_index.faiss")

ENTITY_CACHE_PATH = _path(
    "ENTITY_CACHE_PATH", Path(__file__).resolve().parent.parent / "data" / "entity_cache.json"
)

# --- Retrieval --------------------------------------------------------------
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
RRF_K = int(os.getenv("RRF_K", "60"))
# Candidate breadth per retriever before fusion+rerank. Was hardcoded to 20.
RETRIEVAL_CANDIDATES = int(os.getenv("RETRIEVAL_CANDIDATES", "20"))
# Abstract characters fed to the reranker per (query, abstract) pair. Was 512.
RERANK_MAX_CHARS = int(os.getenv("RERANK_MAX_CHARS", "512"))
# Persisted BM25 index (rebuilt only when the corpus hash changes).
BM25_CACHE_PATH = _path(
    "BM25_CACHE_PATH", Path(__file__).resolve().parent.parent / "data" / "bm25_index.pkl"
)

# --- LLM / agent ------------------------------------------------------------
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
AGENT_MAX_TOKENS = int(os.getenv("AGENT_MAX_TOKENS", "4096"))

# --- Corpus framing (human/LLM-facing labels) -------------------------------
# Swap these to re-theme the assistant for a different domain or dataset.
CORPUS_DOMAIN = os.getenv("CORPUS_DOMAIN", "genomics")
CORPUS_LABEL = os.getenv("CORPUS_LABEL", "7,070 bioRxiv genomics papers")

# --- Server -----------------------------------------------------------------
CORS_ORIGINS = _split("CORS_ORIGINS", "http://localhost:5173")
PORT = int(os.getenv("PORT", "8000"))

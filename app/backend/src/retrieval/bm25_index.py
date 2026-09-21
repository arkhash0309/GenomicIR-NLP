from __future__ import annotations

import hashlib
import pickle
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def corpus_hash(docs: list[str]) -> str:
    h = hashlib.sha256()
    for doc in docs:
        h.update(doc.encode("utf-8", "ignore"))
        h.update(b"\x00")
    return h.hexdigest()


class BM25LexicalIndex:
    def __init__(self, bm25: BM25Okapi, doc_hash: str):
        self._bm25 = bm25
        self._hash = doc_hash

    @classmethod
    def build(cls, docs: list[str], cache_path: Path | None) -> "BM25LexicalIndex":
        doc_hash = corpus_hash(docs)
        if cache_path is not None and Path(cache_path).exists():
            try:
                with open(cache_path, "rb") as f:
                    payload = pickle.load(f)
                if payload.get("hash") == doc_hash:
                    return cls(payload["bm25"], doc_hash)
            except Exception:
                pass  # corrupt/incompatible cache -> rebuild
        bm25 = BM25Okapi([_tokenize(d) for d in docs])
        index = cls(bm25, doc_hash)
        if cache_path is not None:
            Path(cache_path).parent.mkdir(parents=True, exist_ok=True)
            with open(cache_path, "wb") as f:
                pickle.dump({"hash": doc_hash, "bm25": bm25}, f)
        return index

    def search(self, query: str, k: int) -> list[int]:
        scores = self._bm25.get_scores(_tokenize(query))
        return [int(i) for i in np.argsort(scores)[::-1][:k]]

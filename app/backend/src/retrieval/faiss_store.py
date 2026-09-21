from __future__ import annotations

import numpy as np


class FaissVectorStore:
    def __init__(self, index, embedder):
        self._index = index
        self._embedder = embedder

    def search(self, query: str, k: int) -> list[int]:
        vec = self._embedder.encode([query])
        _, ids_raw = self._index.search(np.array(vec, dtype="float32"), k)
        return [int(i) for i in ids_raw[0] if i >= 0]

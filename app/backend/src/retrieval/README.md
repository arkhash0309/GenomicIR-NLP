# Retrieval adapters

`hybrid_search` composes two swappable retrievers, fuses them with Reciprocal
Rank Fusion, and reranks with a cross-encoder.

## Contract

```python
class VectorStore(Protocol):
    def search(self, query: str, k: int) -> list[int]: ...  # corpus doc ids

class LexicalIndex(Protocol):
    def search(self, query: str, k: int) -> list[int]: ...
```

Doc ids are 0-based positions in `data_store.get_papers()`.

## Swapping in Qdrant (example)

```python
class QdrantVectorStore:
    def __init__(self, client, collection, embedder):
        self._client, self._collection, self._embedder = client, collection, embedder

    def search(self, query: str, k: int) -> list[int]:
        vec = self._embedder.encode([query])[0].tolist()
        hits = self._client.search(self._collection, vec, limit=k)
        return [int(h.id) for h in hits]
```

Wire it in `search.load_search_indexes()` by assigning `_vector_store`.

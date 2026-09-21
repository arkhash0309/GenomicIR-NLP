from typing import Protocol, runtime_checkable


@runtime_checkable
class VectorStore(Protocol):
    """Semantic retriever. Returns corpus doc ids (positions in get_papers())."""

    def search(self, query: str, k: int) -> list[int]:
        ...


@runtime_checkable
class LexicalIndex(Protocol):
    """Lexical retriever. Returns corpus doc ids (positions in get_papers())."""

    def search(self, query: str, k: int) -> list[int]:
        ...

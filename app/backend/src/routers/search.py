from fastapi import APIRouter, Query

from ..search import hybrid_search

router = APIRouter()


@router.get("/search")
async def search(q: str = Query(""), k: int = Query(5, ge=1, le=20)):
    if not q.strip():
        return {"query": q, "results": []}
    # Return the SearchResult models as-is ({paper, score, rank}) so the response
    # matches both models.SearchResult and the frontend's SearchResult contract.
    results = hybrid_search(q, top_k=k)
    return {"query": q, "results": results}

from fastapi import APIRouter, Query
from ..search import hybrid_search

router = APIRouter()


@router.get("/search")
async def search(q: str = Query(""), k: int = Query(5, ge=1, le=20)):
    if not q.strip():
        return {"query": q, "results": []}
    results = hybrid_search(q, top_k=k)
    return {
        "query": q,
        "results": [
            {
                "id": r.paper.id,
                "title": r.paper.title,
                "authors": r.paper.authors,
                "doi": r.paper.doi,
                "url": r.paper.url,
                "date": r.paper.date,
                "abstract": r.paper.abstract,
                "summary": r.paper.summary,
                "score": r.score,
                "rank": r.rank,
            }
            for r in results
        ],
    }

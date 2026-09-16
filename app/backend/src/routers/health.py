from fastapi import APIRouter
from ..data_store import get_papers
from ..graph import graph_stats

router = APIRouter()


@router.get("/health")
async def health():
    papers = get_papers()
    stats = graph_stats()
    return {"status": "ok", "paper_count": len(papers), **stats}


@router.get("/stats")
async def stats():
    papers = get_papers()
    avg_words = sum(len(p.abstract.split()) for p in papers) / max(len(papers), 1)
    return {
        **graph_stats(),
        "avg_abstract_words": round(avg_words, 1),
        "papers_with_summary": sum(1 for p in papers if p.summary),
    }

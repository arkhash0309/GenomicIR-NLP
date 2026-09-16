from fastapi import APIRouter, Query
from ..graph import get_papers_by_entity, get_entity_connections, get_subgraph, graph_stats
from ..data_store import get_paper_by_id

router = APIRouter()


@router.get("/entity/{name}")
async def entity(name: str):
    ids = get_papers_by_entity(name)
    papers = [get_paper_by_id(i) for i in ids[:20]]
    conns = get_entity_connections(name)
    return {
        "entity": name,
        "paper_count": len(ids),
        "papers": [{"id": p.id, "title": p.title, "doi": p.doi} for p in papers if p],
        "connections": conns,
    }


@router.get("/graph/subgraph")
async def subgraph(entities: str = Query("")):
    names = [e.strip() for e in entities.split(",") if e.strip()]
    if not names:
        return {"nodes": [], "edges": []}
    return get_subgraph(names)


@router.get("/graph/stats")
async def stats():
    return graph_stats()

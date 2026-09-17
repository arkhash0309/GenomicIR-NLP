from fastapi import APIRouter, HTTPException

from ..data_store import get_paper_by_id
from ..ner import get_paper_entities

router = APIRouter()


@router.get("/paper/{paper_id}")
async def paper(paper_id: int):
    p = get_paper_by_id(paper_id)
    if not p:
        raise HTTPException(404, "not found")
    return {**p.model_dump(), "entities": get_paper_entities(paper_id)}

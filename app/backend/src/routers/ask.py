from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..agent import run_agent_stream

router = APIRouter()


class AskBody(BaseModel):
    question: str


@router.post("/ask")
async def ask(body: AskBody):
    if not body.question.strip():
        raise HTTPException(status_code=422, detail="question required")
    return StreamingResponse(
        run_agent_stream(body.question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

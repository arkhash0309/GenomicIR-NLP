import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.data_store import load_papers
from src.search import load_search_indexes
from src.ner import load_ner, load_entity_cache, build_entity_cache
from src.graph import build_graph
from src.routers import health, search, paper, graph_routes, ask

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading papers...")
    papers = load_papers()
    print(f"  {len(papers)} papers loaded")
    print("Loading search indexes...")
    load_search_indexes()
    print("Loading NER models...")
    load_ner()
    load_entity_cache()
    print("Building entity cache (skipped if cached)...")
    build_entity_cache(papers)
    print("Building knowledge graph...")
    build_graph()
    print("Ready.")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="GenomicIR-NLP", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(search.router)
    app.include_router(paper.router)
    app.include_router(graph_routes.router)
    app.include_router(ask.router)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )

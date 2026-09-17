import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture(scope="session")
async def client():
    """
    Session-scoped async client.

    httpx.ASGITransport does not send ASGI lifespan events, so we call the
    startup functions directly before creating the client.  This mirrors what
    the lifespan context manager does in production but runs once per test
    session without requiring lifespan support from the transport.
    """
    # Run startup (loads papers, search indexes, NER, entity cache, graph)
    from src.data_store import load_papers
    from src.graph import build_graph
    from src.ner import build_entity_cache, load_entity_cache, load_ner
    from src.search import load_search_indexes

    papers = load_papers()
    load_search_indexes()
    load_ner()
    load_entity_cache()
    build_entity_cache(papers)
    build_graph()

    from main import create_app
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "paper_count" in data


@pytest.mark.asyncio
async def test_search_returns_results(client):
    r = await client.get("/search?q=CRISPR&k=3")
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert len(data["results"]) <= 3


@pytest.mark.asyncio
async def test_paper_by_id(client):
    r = await client.get("/paper/0")
    assert r.status_code == 200
    assert "title" in r.json()


@pytest.mark.asyncio
async def test_paper_not_found(client):
    r = await client.get("/paper/9999999")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_graph_stats(client):
    r = await client.get("/graph/stats")
    assert r.status_code == 200
    assert "entity_count" in r.json()


@pytest.mark.asyncio
async def test_search_empty_query(client):
    r = await client.get("/search?q=")
    assert r.status_code == 200
    data = r.json()
    assert data["results"] == []


@pytest.mark.asyncio
async def test_stats_endpoint(client):
    r = await client.get("/stats")
    assert r.status_code == 200
    data = r.json()
    assert "entity_count" in data
    assert "avg_abstract_words" in data


@pytest.mark.asyncio
async def test_graph_subgraph_empty(client):
    r = await client.get("/graph/subgraph?entities=")
    assert r.status_code == 200
    data = r.json()
    assert data["nodes"] == []
    assert data["edges"] == []

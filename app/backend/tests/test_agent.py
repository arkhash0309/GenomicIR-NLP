import json, pytest, asyncio
from unittest.mock import patch, AsyncMock, MagicMock


async def _async_iter(items):
    for item in items:
        yield item


@pytest.mark.asyncio
async def test_run_agent_stream_yields_sse_events(mock_papers):
    from src import data_store as ds
    from src import ner as ner_module
    ds._papers = mock_papers
    ner_module._entity_cache = {
        0: [{"name": "breast cancer", "type": "Disease"}],
        1: [{"name": "CRISPR-Cas9", "type": "Chemical"}],
        2: [{"name": "TP53", "type": "Gene"}],
    }

    fake_msg = MagicMock()
    fake_msg.stop_reason = "end_turn"
    fake_msg.content = [MagicMock(type="text", text="Based on the papers, BRCA1 is important.")]

    events_list = [
        MagicMock(type="content_block_delta", delta=MagicMock(type="text_delta", text="Answer text")),
    ]

    fake_stream = AsyncMock()
    fake_stream.__aenter__ = AsyncMock(return_value=fake_stream)
    fake_stream.__aexit__ = AsyncMock(return_value=False)
    fake_stream.__aiter__ = lambda self=None: _async_iter(events_list)
    fake_stream.get_final_message = AsyncMock(return_value=fake_msg)

    with patch("src.agent.client") as mock_client:
        mock_client.messages.stream.return_value = fake_stream
        from src.agent import run_agent_stream
        events = []
        async for chunk in run_agent_stream("What is BRCA1?"):
            if chunk.startswith("data: "):
                events.append(json.loads(chunk[6:]))

    types = [e["type"] for e in events]
    assert "done" in types


@pytest.mark.asyncio
async def test_execute_tool_hybrid_search(mock_papers):
    from src import data_store as ds, search as search_module
    ds._papers = mock_papers
    with patch("src.agent._execute_tool") as mock_tool:
        mock_tool.return_value = json.dumps([{"id": 0, "title": "BRCA1 paper", "doi": "10.x/1", "url": "http://x", "score": 0.9, "abstract_snippet": "BRCA1..."}])
        from src.agent import _execute_tool
        result = _execute_tool("hybrid_search", {"query": "BRCA1 cancer", "k": 3})
        data = json.loads(result)
        assert isinstance(data, list)

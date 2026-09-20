import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


async def _aiter(items):
    for i in items:
        yield i


def _tool_use_stream():
    """A stream that always asks to call a tool (drives the loop to its cap)."""
    start = MagicMock(type="content_block_start",
                      content_block=MagicMock(type="tool_use", id="t1", name="hybrid_search"))
    delta = MagicMock(type="content_block_delta",
                      delta=MagicMock(type="input_json_delta", partial_json='{"query":"x"}'))
    final = MagicMock()
    final.stop_reason = "tool_use"
    s = AsyncMock()
    s.__aenter__ = AsyncMock(return_value=s)
    s.__aexit__ = AsyncMock(return_value=False)
    s.__aiter__ = lambda self=None: _aiter([start, delta])
    s.get_final_message = AsyncMock(return_value=final)
    return s


@pytest.mark.asyncio
async def test_loop_respects_max_steps(mock_papers, monkeypatch):
    from src import agent
    from src import data_store as ds
    ds._papers = mock_papers
    monkeypatch.setattr(agent.config, "AGENT_MAX_STEPS", 2)

    with patch("src.agent.client") as client, \
         patch("src.agent._execute_tool", return_value="[]"):
        client.messages.stream.side_effect = lambda **kw: _tool_use_stream()
        events = []
        async for chunk in agent.run_agent_stream("q"):
            if chunk.startswith("data: "):
                events.append(json.loads(chunk[6:]))

    # Must terminate with a done event despite the tool loop never stopping.
    assert events[-1]["type"] == "done"
    # tool_call events carry the parsed input.
    tool_calls = [e for e in events if e["type"] == "tool_call"]
    assert tool_calls and tool_calls[0]["input"] == {"query": "x"}


@pytest.mark.asyncio
async def test_history_is_prepended(monkeypatch, mock_papers):
    from src import agent
    from src import data_store as ds
    ds._papers = mock_papers
    captured = {}

    def _capture(**kwargs):
        captured["messages"] = kwargs["messages"]
        fake = AsyncMock()
        fake.__aenter__ = AsyncMock(return_value=fake)
        fake.__aexit__ = AsyncMock(return_value=False)
        fake.__aiter__ = lambda self=None: _aiter([
            MagicMock(type="content_block_delta",
                      delta=MagicMock(type="text_delta", text="answer"))])
        m = MagicMock()
        m.stop_reason = "end_turn"
        fake.get_final_message = AsyncMock(return_value=m)
        return fake

    with patch("src.agent.client") as client:
        client.messages.stream.side_effect = _capture
        history = [{"role": "user", "content": "earlier"},
                   {"role": "assistant", "content": "earlier answer"}]
        async for _ in agent.run_agent_stream("new question", history=history):
            pass

    assert captured["messages"][0]["content"] == "earlier"
    assert captured["messages"][-1] == {"role": "user", "content": "new question"}

from src import agent


def test_system_param_has_cache_control_when_enabled(monkeypatch):
    monkeypatch.setattr(agent.config, "PROMPT_CACHING", True)
    blocks = agent.system_param()
    assert blocks[0]["type"] == "text"
    assert blocks[-1]["cache_control"] == {"type": "ephemeral"}


def test_system_param_plain_when_disabled(monkeypatch):
    monkeypatch.setattr(agent.config, "PROMPT_CACHING", False)
    blocks = agent.system_param()
    assert "cache_control" not in blocks[0]


def test_tools_param_marks_last_tool_only(monkeypatch):
    monkeypatch.setattr(agent.config, "PROMPT_CACHING", True)
    tools = agent.tools_param()
    assert "cache_control" not in tools[0]
    assert tools[-1]["cache_control"] == {"type": "ephemeral"}
    # Original TOOLS untouched.
    assert "cache_control" not in agent.TOOLS[-1]

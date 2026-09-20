import importlib


def test_agent_defaults(monkeypatch):
    monkeypatch.delenv("AGENT_MAX_STEPS", raising=False)
    monkeypatch.delenv("PROMPT_CACHING", raising=False)
    from src import config
    importlib.reload(config)
    assert config.AGENT_MAX_STEPS == 8
    assert config.PROMPT_CACHING is True


def test_prompt_caching_can_disable(monkeypatch):
    monkeypatch.setenv("PROMPT_CACHING", "false")
    monkeypatch.setenv("AGENT_MAX_STEPS", "3")
    from src import config
    importlib.reload(config)
    assert config.PROMPT_CACHING is False
    assert config.AGENT_MAX_STEPS == 3

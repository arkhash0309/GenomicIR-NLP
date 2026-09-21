from unittest.mock import MagicMock

from eval.judge import build_judge_prompt, judge_answer, parse_judge_response


def test_build_prompt_includes_inputs():
    prompt = build_judge_prompt("Q?", "A.", ["ctx1", "ctx2"])
    assert "Q?" in prompt and "A." in prompt and "ctx1" in prompt


def test_parse_judge_response_extracts_json():
    text = 'Here is my assessment:\n{"faithfulness": 0.8, "citation_accuracy": 1.0, "notes": "ok"}\nThanks.'
    parsed = parse_judge_response(text)
    assert parsed["faithfulness"] == 0.8
    assert parsed["citation_accuracy"] == 1.0
    assert parsed["notes"] == "ok"


def test_judge_answer_calls_client_and_parses():
    fake_client = MagicMock()
    fake_client.messages.create.return_value = MagicMock(
        content=[MagicMock(text='{"faithfulness": 0.5, "citation_accuracy": 0.5, "notes": "n"}')]
    )
    result = judge_answer("Q?", "A.", ["ctx"], client=fake_client)
    assert result["faithfulness"] == 0.5
    fake_client.messages.create.assert_called_once()

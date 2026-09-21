from __future__ import annotations

import json
import re

from src import config

_INSTRUCTIONS = (
    "You are grading a research assistant's answer for FAITHFULNESS to the "
    "provided source contexts and CITATION ACCURACY. Respond with ONLY a JSON "
    'object: {"faithfulness": <0-1>, "citation_accuracy": <0-1>, "notes": "<short>"}. '
    "faithfulness = fraction of claims supported by the contexts. "
    "citation_accuracy = fraction of cited DOIs that actually support their claim."
)


def build_judge_prompt(question: str, answer: str, contexts: list[str]) -> str:
    joined = "\n\n".join(f"[Context {i + 1}]\n{c}" for i, c in enumerate(contexts))
    return (
        f"{_INSTRUCTIONS}\n\n"
        f"QUESTION:\n{question}\n\n"
        f"ANSWER:\n{answer}\n\n"
        f"SOURCE CONTEXTS:\n{joined}"
    )


def parse_judge_response(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {"faithfulness": 0.0, "citation_accuracy": 0.0, "notes": "unparseable"}
    return json.loads(match.group(0))


def judge_answer(question: str, answer: str, contexts: list[str], client) -> dict:
    prompt = build_judge_prompt(question, answer, contexts)
    resp = client.messages.create(
        model=config.ANTHROPIC_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return parse_judge_response(resp.content[0].text)

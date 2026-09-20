from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class GoldItem:
    query: str
    relevant_dois: list[str] = field(default_factory=list)
    reference_answer: str | None = None


def load_gold(path: str | Path) -> list[GoldItem]:
    items: list[GoldItem] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            items.append(GoldItem(
                query=obj["query"],
                relevant_dois=obj.get("relevant_dois", []),
                reference_answer=obj.get("reference_answer"),
            ))
    return items

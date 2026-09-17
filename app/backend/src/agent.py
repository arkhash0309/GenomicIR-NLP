import asyncio
import json
import re
from typing import AsyncGenerator

import anthropic

from . import config
from .data_store import get_paper_by_id
from .graph import get_entity_connections, get_papers_by_entity
from .ner import extract_entities_from_text, get_paper_entities
from .search import hybrid_search

client = anthropic.AsyncAnthropic()

TOOLS = [
    {"name": "hybrid_search",
     "description": f"Search the {config.CORPUS_LABEL} corpus using hybrid semantic+lexical retrieval with reranking.",
     "input_schema": {"type": "object", "properties": {
         "query": {"type": "string"},
         "k": {"type": "integer", "default": 5}
     }, "required": ["query"]}},
    {"name": "get_papers_by_entity",
     "description": "Find papers mentioning a specific gene, disease, or chemical by name.",
     "input_schema": {"type": "object", "properties": {
         "name": {"type": "string"},
         "entity_type": {"type": "string", "enum": ["Gene", "Disease", "Chemical"]}
     }, "required": ["name", "entity_type"]}},
    {"name": "get_entity_connections",
     "description": "Find biomedical entities that co-occur with a given entity across the corpus.",
     "input_schema": {"type": "object", "properties": {
         "entity": {"type": "string"}
     }, "required": ["entity"]}},
    {"name": "get_paper_details",
     "description": "Get full abstract, authors, DOI, and extracted entities for a paper by ID.",
     "input_schema": {"type": "object", "properties": {
         "paper_id": {"type": "integer"}
     }, "required": ["paper_id"]}},
    {"name": "extract_query_entities",
     "description": "Extract biomedical entities (genes, diseases, chemicals) from a query string.",
     "input_schema": {"type": "object", "properties": {
         "query": {"type": "string"}
     }, "required": ["query"]}},
]

SYSTEM = f"""You are a {config.CORPUS_DOMAIN} research assistant with access to {config.CORPUS_LABEL}.
Strategy: (1) extract key entities from the question, (2) hybrid_search for broad retrieval,
(3) use entity connections to expand via knowledge graph, (4) get_paper_details for top results,
(5) write a grounded answer citing papers as [Author et al., DOI].
Only claim what the papers support."""


def _execute_tool(name: str, inp: dict) -> str:
    try:
        if name == "hybrid_search":
            results = hybrid_search(inp["query"], inp.get("k", 5))
            return json.dumps([{"id": r.paper.id, "title": r.paper.title,
                                 "authors": r.paper.authors, "doi": r.paper.doi,
                                 "url": r.paper.url, "score": r.score,
                                 "abstract_snippet": r.paper.abstract[:300]} for r in results])
        if name == "get_papers_by_entity":
            entity_type = inp.get("entity_type", "")
            entity_name = inp["name"]
            search_name = f"{entity_type}:{entity_name}" if entity_type else entity_name
            ids = get_papers_by_entity(search_name)
            papers = [get_paper_by_id(i) for i in ids[:10]]
            return json.dumps([{"id": p.id, "title": p.title, "doi": p.doi}
                                for p in papers if p])
        if name == "get_entity_connections":
            return json.dumps(get_entity_connections(inp["entity"]))
        if name == "get_paper_details":
            p = get_paper_by_id(inp["paper_id"])
            if not p:
                return json.dumps({"error": "not found"})
            return json.dumps({"id": p.id, "title": p.title, "authors": p.authors,
                                "doi": p.doi, "url": p.url, "date": p.date,
                                "abstract": p.abstract, "summary": p.summary,
                                "entities": get_paper_entities(p.id)})
        if name == "extract_query_entities":
            return json.dumps(extract_entities_from_text(inp["query"]))
        return json.dumps({"error": f"unknown tool {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


def _graph_events(tool_name: str, result: str) -> list[dict]:
    try:
        data = json.loads(result)
        if tool_name == "hybrid_search":
            nodes = [{"id": f"paper_{p['id']}", "label": p["title"][:40], "type": "paper"}
                     for p in data]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
        if tool_name == "extract_query_entities":
            nodes = [{"id": f"{e['type']}:{e['name'].lower()}", "label": e["name"], "type": e["type"]}
                     for e in data]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
        if tool_name == "get_entity_connections":
            nodes = [{"id": f"{c['type']}:{c['name'].lower()}", "label": c["name"], "type": c["type"]}
                     for c in data[:12]]
            return [{"type": "graph_update", "nodes": nodes, "edges": []}]
    except Exception:
        pass
    return []


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def run_agent_stream(question: str) -> AsyncGenerator[str, None]:
    messages = [{"role": "user", "content": question}]
    while True:
        tool_calls: list[dict] = []
        text_buf = ""
        async with client.messages.stream(
            model=config.ANTHROPIC_MODEL, max_tokens=config.AGENT_MAX_TOKENS,
            system=SYSTEM, tools=TOOLS, messages=messages
        ) as stream:
            async for event in stream:
                etype = getattr(event, "type", None)
                if etype == "content_block_start":
                    cb = event.content_block
                    if getattr(cb, "type", None) == "tool_use":
                        tool_calls.append({"id": cb.id, "name": cb.name, "buf": ""})
                        yield _sse({"type": "tool_call", "tool": cb.name, "input": {}})
                elif etype == "content_block_delta":
                    d = event.delta
                    if getattr(d, "type", None) == "text_delta":
                        text_buf += d.text
                        yield _sse({"type": "reasoning", "text": d.text})
                    elif getattr(d, "type", None) == "input_json_delta" and tool_calls:
                        tool_calls[-1]["buf"] += d.partial_json
            final = await stream.get_final_message()

        stop = final.stop_reason
        for tc in tool_calls:
            try:
                tc["input"] = json.loads(tc["buf"]) if tc["buf"] else {}
            except json.JSONDecodeError:
                tc["input"] = {}

        if stop == "tool_use" and tool_calls:
            content = []
            if text_buf:
                content.append({"type": "text", "text": text_buf})
            for tc in tool_calls:
                content.append({"type": "tool_use", "id": tc["id"],
                                 "name": tc["name"], "input": tc["input"]})
            messages.append({"role": "assistant", "content": content})

            tool_results = []
            for tc in tool_calls:
                result = await asyncio.to_thread(_execute_tool, tc["name"], tc["input"])
                for ge in _graph_events(tc["name"], result):
                    yield _sse(ge)
                yield _sse({"type": "tool_result", "tool": tc["name"],
                             "summary": result[:300]})
                tool_results.append({"type": "tool_result",
                                      "tool_use_id": tc["id"], "content": result})
            messages.append({"role": "user", "content": tool_results})
        else:
            dois = re.findall(r'10\.\d{4,}[^\s\]]+', text_buf)
            yield _sse({"type": "done", "citations": list(set(dois))})
            break

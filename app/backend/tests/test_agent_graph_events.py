import json

from src import agent


def test_hybrid_search_emits_paper_nodes_and_mention_edges(monkeypatch):
    monkeypatch.setattr(agent, "paper_entity_ids", lambda pid: ["Gene:brca1"] if pid == 3 else [])
    result = json.dumps([{"id": 3, "title": "BRCA1 paper", "doi": "10.1/x"}, {"id": 4, "title": "Other", "doi": ""}])
    [event] = agent._graph_events("hybrid_search", {"query": "brca1"}, result)
    assert [n["id"] for n in event["nodes"]] == ["paper_3", "paper_4"]
    assert event["edges"] == [{"source": "paper_3", "target": "Gene:brca1", "type": "mentions", "weight": 1}]


def test_entity_connections_link_the_queried_entity_to_its_neighbours(monkeypatch):
    monkeypatch.setattr(agent, "entity_node_ids", lambda name: ["Gene:brca1"])
    result = json.dumps([{"name": "PARP1", "type": "Gene", "weight": 41},
                         {"name": "olaparib", "type": "Chemical", "weight": 22}])
    [event] = agent._graph_events("get_entity_connections", {"entity": "BRCA1"}, result)
    assert {"id": "Gene:brca1", "label": "BRCA1", "type": "Gene"} in event["nodes"]
    assert {(e["source"], e["target"], e["weight"]) for e in event["edges"]} == {
        ("Gene:brca1", "Gene:parp1", 41),
        ("Gene:brca1", "Chemical:olaparib", 22),
    }


def test_unknown_entity_still_emits_neighbour_nodes_without_edges(monkeypatch):
    monkeypatch.setattr(agent, "entity_node_ids", lambda name: [])
    result = json.dumps([{"name": "TP53", "type": "Gene", "weight": 5}])
    [event] = agent._graph_events("get_entity_connections", {"entity": "unknownium"}, result)
    assert event["nodes"] == [{"id": "Gene:tp53", "label": "TP53", "type": "Gene"}]
    assert event["edges"] == []


def test_malformed_result_emits_nothing():
    assert agent._graph_events("hybrid_search", {}, "not json") == []

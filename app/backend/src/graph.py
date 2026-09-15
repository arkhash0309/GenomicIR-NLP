import networkx as nx
from .models import GraphNode, GraphEdge, SubgraphResponse
from .data_store import get_papers
from .ner import get_paper_entities

_G: nx.DiGraph | None = None


def build_graph() -> None:
    global _G
    papers = get_papers()
    G = nx.DiGraph()

    entity_papers: dict[str, list[int]] = {}

    for paper in papers:
        pid = f"paper_{paper.id}"
        G.add_node(pid, kind="paper", label=paper.title[:60], paper_id=paper.id)
        for ent in get_paper_entities(paper.id):
            ekey = f"{ent['type']}:{ent['name'].lower()}"
            if not G.has_node(ekey):
                G.add_node(ekey, kind=ent["type"], label=ent["name"])
            G.add_edge(pid, ekey, rel="mentions")
            entity_papers.setdefault(ekey, []).append(paper.id)

    keys = list(entity_papers.keys())
    for i, k1 in enumerate(keys):
        for k2 in keys[i + 1:]:
            shared = len(set(entity_papers[k1]) & set(entity_papers[k2]))
            if shared >= 2:
                G.add_edge(k1, k2, rel="co_occurs_with", weight=shared)
                G.add_edge(k2, k1, rel="co_occurs_with", weight=shared)
    _G = G


def graph_stats() -> dict:
    G = _G
    kinds = nx.get_node_attributes(G, "kind")
    entity_count = sum(1 for k in kinds.values() if k != "paper")
    return {
        "paper_count": sum(1 for k in kinds.values() if k == "paper"),
        "entity_count": entity_count,
        "edge_count": G.number_of_edges(),
    }


def get_papers_by_entity(name: str) -> list[int]:
    needle = name.lower()
    ids: list[int] = []
    for node, data in _G.nodes(data=True):
        if data.get("kind") != "paper" and needle in node.lower():
            for pred in _G.predecessors(node):
                if _G.nodes[pred].get("kind") == "paper":
                    pid = _G.nodes[pred].get("paper_id")
                    if pid is not None:
                        ids.append(pid)
    return list(set(ids))


def get_entity_connections(entity: str) -> list[dict]:
    needle = entity.lower()
    conns: dict[str, dict] = {}
    for node in _G.nodes:
        if _G.nodes[node].get("kind") != "paper" and needle in node.lower():
            for nbr in _G.successors(node):
                edata = _G.edges[node, nbr]
                if edata.get("rel") == "co_occurs_with":
                    nd = _G.nodes[nbr]
                    w = edata.get("weight", 1)
                    if nbr not in conns or conns[nbr]["weight"] < w:
                        conns[nbr] = {"name": nd.get("label", nbr), "type": nd.get("kind", "Entity"), "weight": w}
    return sorted(conns.values(), key=lambda x: x["weight"], reverse=True)[:20]


def get_subgraph(entity_names: list[str]) -> SubgraphResponse:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen: set[str] = set()

    def _add_node(nid: str):
        if nid in seen:
            return
        seen.add(nid)
        d = _G.nodes[nid]
        kind = d.get("kind", "Entity")
        ntype = kind if kind in ("paper", "Gene", "Disease", "Chemical") else "Gene"
        nodes.append(GraphNode(id=nid, label=d.get("label", nid)[:40], type=ntype))

    for name in entity_names:
        needle = name.lower()
        matches = [n for n in _G.nodes if _G.nodes[n].get("kind") != "paper" and needle in n.lower()][:3]
        for key in matches:
            _add_node(key)
            for nbr in list(_G.successors(key))[:8]:
                if _G.nodes[nbr].get("kind") != "paper":
                    _add_node(nbr)
                    ed = _G.edges[key, nbr]
                    edges.append(GraphEdge(source=key, target=nbr,
                                           type=ed.get("rel", "co_occurs_with"),
                                           weight=float(ed.get("weight", 1))))
    return SubgraphResponse(nodes=nodes, edges=edges)

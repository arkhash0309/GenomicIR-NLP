from pydantic import BaseModel
from typing import Literal


class Paper(BaseModel):
    id: int
    title: str
    authors: str
    doi: str
    date: str
    url: str
    abstract: str
    summary: str


class Entity(BaseModel):
    name: str
    type: Literal["Gene", "Disease", "Chemical"]


class SearchResult(BaseModel):
    paper: Paper
    score: float
    rank: int


class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["paper", "Gene", "Disease", "Chemical"]


class GraphEdge(BaseModel):
    source: str
    target: str
    type: Literal["mentions", "co_occurs_with"]
    weight: float = 1.0


class SubgraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]

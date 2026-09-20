# Knowledge Graph: Persistence & Neo4j Adapter Guide

This guide documents the graph persistence layer and illustrates how to extend it with a Neo4j backend.

## Persisted Graph Cache

The knowledge graph is built once at startup and cached as a pickle to avoid rebuilding on repeated starts.

### Cache Strategy

- **Path:** `GRAPH_CACHE_PATH` (default: `app/backend/data/graph.pkl`)
- **Invalidation:** The cache is keyed by `entity_cache_hash()`, a SHA256 digest over the entire entity cache (paper ID + entity type and name pairs, sorted by paper ID).
- **Startup behavior:**
  - On `build_graph()`, compute `entity_cache_hash()`
  - If `GRAPH_CACHE_PATH` exists and its stored hash matches the current hash, load the cached graph, `_entity_papers`, and `_entity_nodes`.
  - Otherwise, rebuild the graph from scratch and pickle it with the new hash.
  - Set `GRAPH_CACHE_PATH=None` to disable persistence entirely (useful during development or for always-fresh graphs).

### Cache Contents

The pickled payload contains:
- `"hash"`: the entity-cache SHA256 digest
- `"graph"`: a `networkx.DiGraph` with paper and entity nodes
- `"entity_papers"`: a dict mapping entity keys (e.g., `"Gene:tp53"`) to lists of paper IDs

## Canonicalization Seam

Entity names are deduplicated by an optional alias map, collapsing synonyms to a single canonical name.

### Configuration

- **Path:** `ENTITY_ALIAS_PATH` (environment variable; no default)
- **Format:** JSON object: `{"p53": "TP53", "brca1": "BRCA1", ...}`
- **Lookup:** case-insensitive via `normalize_name()` (whitespace normalization + lowercase)

### Workflow

1. NER extracts raw text (e.g., "p53")
2. `canonicalize_entity(name)` looks it up in the alias map and returns the canonical form ("TP53") or the original if not found
3. Graph nodes use canonical names (e.g., `"Gene:TP53"`), so synonyms always resolve to the same node

> Note: changing `ENTITY_ALIAS_PATH` also requires deleting `entity_cache.json` to force re-extraction with the new aliases; otherwise the graph cache (keyed by the entity-cache hash) is not invalidated and will still reflect the old aliases.

### When to Use

- **Yes:** if your corpus has known synonyms or legacy name variants
- **No:** leave `ENTITY_ALIAS_PATH` unset for an identity-passthrough

## Neo4j Adapter Sketch

The current graph interface (`get_papers_by_entity`, `get_entity_connections`, `get_subgraph`) is agnostic to the backing store. Here's how to swap in Neo4j while preserving the API contract.

### Current Architecture (NetworkX)

- **Paper nodes:** labeled `"paper"`, keyed by `paper_{id}`
- **Entity nodes:** labeled by type (Gene, Disease, Chemical), keyed by `"{type}:{normalized_name}"`
- **Edges:**
  - `mentions` (paper → entity): paper references an entity
  - `co_occurs_with` (entity ↔ entity): entities appear together in at least `COOCCURRENCE_MIN` papers, weighted by shared-paper count

### Neo4j Mapping

Replace the in-memory NetworkX graph with Neo4j using the Cypher query language:

#### Node Creation

```cypher
-- Create paper node
MERGE (p:Paper {id: $paper_id, title: $title})

-- Create entity node (canonicalized)
MERGE (e:Gene {name: $canonical_name})
ON CREATE SET e.original_names = [$original_name]
ON MATCH SET e.original_names = CASE WHEN $original_name IN e.original_names THEN e.original_names ELSE e.original_names + [$original_name] END
```

#### Edge Creation

```cypher
-- Link paper to entity via mentions
MERGE (p:Paper {id: $paper_id}) - [r:MENTIONS] -> (e:Gene {name: $canonical_name})

-- Link entities via co_occurs_with (both directions, weighted)
MERGE (e1:Gene {name: $entity1_name})
MERGE (e2:Gene {name: $entity2_name})
MERGE (e1) - [r:CO_OCCURS_WITH {weight: $shared_paper_count}] - (e2)
```

#### Query Translation

**get_papers_by_entity(name: str) → list[int]**

```cypher
MATCH (p:Paper) - [:MENTIONS] - (e)
WHERE e.name CONTAINS toLower($search_term) OR ANY(alias IN e.original_names WHERE alias CONTAINS toLower($search_term))
RETURN DISTINCT p.id ORDER BY p.id
```

**get_entity_connections(entity: str) → list[dict]**

```cypher
MATCH (e) - [r:CO_OCCURS_WITH] - (neighbor)
WHERE e.name CONTAINS toLower($search_term)
RETURN neighbor.name, neighbor.type, r.weight
ORDER BY r.weight DESC
LIMIT 20
```

**get_subgraph(entity_names: list[str]) → SubgraphResponse**

```cypher
-- Match entities by name (fuzzy search)
MATCH (e) WHERE ANY(name IN $entity_names WHERE e.name CONTAINS toLower(name))

-- Collect co-occurring neighbors and paper mentions
WITH COLLECT(DISTINCT e) AS seed_entities
UNWIND seed_entities AS entity
OPTIONAL MATCH (entity) - [c:CO_OCCURS_WITH] - (neighbor) LIMIT 8
OPTIONAL MATCH (paper:Paper) - [:MENTIONS] - (entity) LIMIT 8
RETURN DISTINCT entity, neighbor, paper, c.weight AS weight
```

### Migration Path

1. Keep both backends in parallel initially: NetworkX for performance, Neo4j for inspection
2. Implement a `GraphStore` abstraction interface with two implementations: `NetworkXGraphStore` and `Neo4jGraphStore`
3. Route all graph queries through the abstraction; inject the desired backend via `config.GRAPH_BACKEND`
4. Migrate production workloads only after validating result consistency and query performance
5. Use the persisted pickle as a fallback or cold-start strategy if Neo4j is temporarily unavailable

### Benefits of Neo4j

- **Query flexibility:** Cypher patterns express complex traversals (transitive relations, conditional paths) concisely
- **Scalability:** graph databases handle billion-edge networks where NetworkX would exhaust memory
- **Real-time updates:** add entities or papers on-the-fly without rebuilding the entire graph
- **Introspection:** rich query tools for exploration, analytics, and graph analytics algorithms (PageRank, community detection, etc.)

### Caveats

- **Latency:** network round-trip to a Neo4j server (~5–50ms per query) vs. in-memory access (~μs)
- **Operational complexity:** requires Neo4j deployment, backups, and monitoring
- **Connection pooling:** manage connection state carefully in a high-concurrency environment

## Configuration Reference

| Variable | Default | Behavior |
|---|---|---|
| `GRAPH_CACHE_PATH` | `app/backend/data/graph.pkl` | Location of pickled graph; set to `None` to disable caching |
| `ENTITY_ALIAS_PATH` | (unset) | Path to JSON alias map; if unset, no canonicalization applied |
| `COOCCURRENCE_MIN` | `2` | Minimum shared papers for a co-occurrence edge |
| `NER_MAX_CHARS` | `2000` | Characters of each abstract sent to NER; changes here invalidate the entity cache |

## Examples

### Disable the cache (development)

```bash
export GRAPH_CACHE_PATH=None
make backend
```

### Use a custom alias map

```bash
cat > aliases.json <<EOF
{
  "p53": "TP53",
  "tumor suppressor": "TP53",
  "brca-1": "BRCA1"
}
EOF

export ENTITY_ALIAS_PATH=$(pwd)/aliases.json
make backend
```

### Lower the co-occurrence threshold

```bash
export COOCCURRENCE_MIN=1
make backend
```

This will add more edges, increasing memory usage but capturing rarer associations.

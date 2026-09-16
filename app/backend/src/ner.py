import json
from pathlib import Path
import spacy

CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "entity_cache.json"

_bc5cdr = None   # DISEASE, CHEMICAL
_jnlpba = None   # DNA, RNA, PROTEIN → Gene
_entity_cache: dict[int, list[dict]] = {}
_cache_loaded: bool = False

_BC5CDR_MAP = {"DISEASE": "Disease", "CHEMICAL": "Chemical"}
_JNLPBA_MAP = {"DNA": "Gene", "RNA": "Gene", "PROTEIN": "Gene"}


def load_ner() -> None:
    global _bc5cdr, _jnlpba
    _bc5cdr = spacy.load("en_ner_bc5cdr_md")
    _jnlpba = spacy.load("en_ner_jnlpba_md")


def load_entity_cache() -> None:
    global _entity_cache, _cache_loaded
    if CACHE_PATH.exists():
        with open(CACHE_PATH) as f:
            _entity_cache = {int(k): v for k, v in json.load(f).items()}
        if _entity_cache:
            _cache_loaded = True


def save_entity_cache() -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(_entity_cache, f)


def _extract(text: str) -> list[dict]:
    text = text[:1000]
    seen: set[str] = set()
    results = []
    for doc, label_map in [(_bc5cdr(text), _BC5CDR_MAP), (_jnlpba(text), _JNLPBA_MAP)]:
        for ent in doc.ents:
            etype = label_map.get(ent.label_)
            key = f"{etype}:{ent.text.lower()}"
            if etype and key not in seen:
                seen.add(key)
                results.append({"name": ent.text, "type": etype})
    return results


def build_entity_cache(papers) -> None:
    global _cache_loaded
    if _cache_loaded:
        return
    _cache_loaded = True
    for paper in papers:
        _entity_cache[paper.id] = _extract(paper.abstract)
    save_entity_cache()


def get_paper_entities(paper_id: int) -> list[dict]:
    return _entity_cache.get(paper_id, [])


def extract_entities_from_text(text: str) -> list[dict]:
    return _extract(text)

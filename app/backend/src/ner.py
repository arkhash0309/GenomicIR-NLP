import hashlib
import json
import re

from . import config

CACHE_PATH = config.ENTITY_CACHE_PATH

_aliases: dict[str, str] = {}


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().lower()


def load_aliases() -> dict[str, str]:
    global _aliases
    _aliases = {}
    if config.ENTITY_ALIAS_PATH and config.ENTITY_ALIAS_PATH.exists():
        with open(config.ENTITY_ALIAS_PATH) as f:
            raw = json.load(f)
        _aliases = {normalize_name(k): v for k, v in raw.items()}
    return _aliases


def canonicalize_entity(name: str) -> str:
    target = _aliases.get(normalize_name(name))
    return target if target is not None else name.strip()

_bc5cdr = None   # DISEASE, CHEMICAL
_jnlpba = None   # DNA, RNA, PROTEIN → Gene
_entity_cache: dict[int, list[dict]] = {}
_cache_loaded: bool = False

_BC5CDR_MAP = {"DISEASE": "Disease", "CHEMICAL": "Chemical"}
_JNLPBA_MAP = {"DNA": "Gene", "RNA": "Gene", "PROTEIN": "Gene"}


def load_ner() -> None:
    global _bc5cdr, _jnlpba
    # Lazy import to avoid loading spaCy/scispaCy (and their DLLs) at module
    # import time — mirrors the lazy import in search.py.
    import spacy
    _bc5cdr = spacy.load("en_ner_bc5cdr_md")
    _jnlpba = spacy.load("en_ner_jnlpba_md")
    load_aliases()


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
    text = text[:config.NER_MAX_CHARS]
    seen: set[str] = set()
    results = []
    for doc, label_map in [(_bc5cdr(text), _BC5CDR_MAP), (_jnlpba(text), _JNLPBA_MAP)]:
        for ent in doc.ents:
            etype = label_map.get(ent.label_)
            if not etype:
                continue
            canonical = canonicalize_entity(ent.text)
            key = f"{etype}:{normalize_name(canonical)}"
            if key not in seen:
                seen.add(key)
                results.append({"name": canonical, "type": etype})
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


def entity_cache_hash() -> str:
    h = hashlib.sha256()
    for pid in sorted(_entity_cache):
        h.update(str(pid).encode())
        for ent in _entity_cache[pid]:
            h.update(f"{ent['type']}:{ent['name']}".encode("utf-8", "ignore"))
        h.update(b"\x00")
    return h.hexdigest()

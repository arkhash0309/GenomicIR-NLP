import pandas as pd

from . import config
from .models import Paper

_META = config.METADATA_PATH
_CSV = config.CSV_PATH

_papers: list[Paper] = []
_papers_by_id: dict[int, Paper] = {}


def _reset_papers():
    global _papers, _papers_by_id
    _papers = []
    _papers_by_id = {}


def load_papers() -> list[Paper]:
    global _papers, _papers_by_id
    if _papers:
        return _papers
    df = pd.read_pickle(_META).reset_index(drop=True)
    csv_df = pd.read_csv(_CSV)
    summary_map: dict[str, str] = dict(
        zip(csv_df["Title"].str.strip(), csv_df["Summary"].fillna(""))
    )
    papers = []
    for i, row in df.iterrows():
        title = str(row.get("Title", "")).strip()
        papers.append(Paper(
            id=int(i),
            title=title,
            authors=str(row.get("Authors", "")).strip(),
            doi=str(row.get("DOI", "")).strip(),
            date=str(row.get("Date", "")).strip(),
            url=str(row.get("Paper URL", "")).strip(),
            abstract=str(row.get("Abstract", "")).strip(),
            summary=summary_map.get(title, ""),
        ))
    _papers = [p for p in papers if p.title and p.abstract]
    _papers_by_id = {p.id: p for p in _papers}
    return _papers


def get_papers() -> list[Paper]:
    if not _papers:
        load_papers()
    return _papers


def get_paper_by_id(paper_id: int) -> Paper | None:
    return _papers_by_id.get(paper_id)

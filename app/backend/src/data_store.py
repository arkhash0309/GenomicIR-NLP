import pickle
from pathlib import Path
import pandas as pd
from .models import Paper

_REPO_ROOT = Path(__file__).resolve().parents[3]
_META = _REPO_ROOT / "notebooks" / "5_INFORMATION_RETRIEVAL" / "data" / "metadata.pkl"
_CSV  = _REPO_ROOT / "notebooks" / "5_INFORMATION_RETRIEVAL" / "data" / "papers_combined_with_abstract_and_summary.csv"

_papers: list[Paper] = []


def _reset_papers():
    global _papers
    _papers = []


def load_papers() -> list[Paper]:
    global _papers
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
    return _papers


def get_papers() -> list[Paper]:
    return _papers


def get_paper_by_id(paper_id: int) -> Paper | None:
    if 0 <= paper_id < len(_papers):
        return _papers[paper_id]
    return None

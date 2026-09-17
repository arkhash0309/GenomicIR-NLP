import pytest

from src.data_store import _reset_papers, load_papers
from src.models import Paper


@pytest.fixture(scope="session")
def loaded_papers():
    return load_papers()


@pytest.fixture
def mock_papers():
    return [
        Paper(id=0, title="BRCA1 mutations in breast cancer", authors="Smith J",
              doi="10.1000/test.001", date="2023-01", url="https://example.com/1",
              abstract="BRCA1 is a tumor suppressor gene associated with hereditary breast and ovarian cancer. Mutations in BRCA1 increase cancer risk significantly.",
              summary="BRCA1 mutations increase cancer risk."),
        Paper(id=1, title="CRISPR-Cas9 genome editing in human cells", authors="Jones A",
              doi="10.1000/test.002", date="2023-02", url="https://example.com/2",
              abstract="CRISPR-Cas9 enables precise genome editing in human cells. This technology has revolutionized genetic research and therapy development.",
              summary="CRISPR enables genome editing."),
        Paper(id=2, title="RNA sequencing reveals gene expression patterns", authors="Lee B",
              doi="10.1000/test.003", date="2023-03", url="https://example.com/3",
              abstract="RNA sequencing analysis reveals complex gene expression patterns in cancer cells. Differential expression of key genes including TP53 affects treatment outcomes.",
              summary="RNA-seq reveals cancer gene expression."),
    ]

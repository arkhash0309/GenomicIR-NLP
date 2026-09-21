# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Central backend configuration module (`app/backend/src/config.py`) — model IDs,
  retrieval parameters, CORS origins, corpus framing, and data paths are now
  environment-driven and overridable via `.env`.
- Sample-dataset builder (`scripts/build_sample_dataset.py`) and a documented
  "bring your own corpus" flow.
- `Makefile` with one-command tasks (`install`, `backend`, `frontend`, `up`,
  `test`, `lint`, `format`, `sample`, `clean`).
- Continuous integration (GitHub Actions): backend ruff + core pytest, frontend
  lint + test + build.
- Tooling: ruff (backend), ESLint + Prettier + Vitest (frontend), `.editorconfig`.
- Community health files: issue/PR templates, `CONTRIBUTING`, `CODE_OF_CONDUCT`,
  `SECURITY`, `CITATION.cff`.
- Rewritten, template-oriented `README` with architecture diagram and setup guide.

### Changed
- Renamed `notebooks/` to `pipeline/` and added a pipeline README to separate the
  data-preparation story from the application.
- spaCy is now lazily imported in the NER module (mirrors the search module),
  keeping core modules import-light.

### Fixed
- `/search` now returns the `{paper, score, rank}` shape that both `models.SearchResult`
  and the frontend expect (the router was flattening it), fixing a crash on the Search page.
- The backend now imports `torch` before spaCy/sentence-transformers so it starts reliably
  on Windows (previously failed with `WinError 1114` loading `c10.dll`).

### Removed
- Legacy duplicate application under `notebooks/app/`.

## [1.0.0]

- Initial release: agentic GraphRAG over 7,070 bioRxiv genomics papers
  (FastAPI + React), with hybrid retrieval, scispaCy NER, a NetworkX knowledge
  graph, and a streaming LLM agent.

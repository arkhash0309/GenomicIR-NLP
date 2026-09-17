# Contributing to GenomicIR-NLP

Thanks for your interest in contributing! This project is designed to be a
reusable template for **agentic GraphRAG over a scientific corpus**, so
improvements to clarity, developer experience, and reusability are especially
welcome.

## Ways to contribute

- 🐛 **Report bugs** via the [issue tracker](https://github.com/arkhash0309/GenomicIR-NLP/issues)
- 💡 **Suggest features** or improvements
- 📖 **Improve docs** — READMEs, comments, and examples
- 🔧 **Send pull requests** for fixes and features

## Development setup

```bash
git clone https://github.com/arkhash0309/GenomicIR-NLP.git
cd GenomicIR-NLP
cp .env.example .env          # add your ANTHROPIC_API_KEY

make install                  # backend + frontend deps
make backend                  # terminal 1 — http://localhost:8000
make frontend                 # terminal 2 — http://localhost:5173
```

Prefer Docker? `make up` builds and runs the whole stack.

## Before you open a PR

Run the checks locally:

```bash
make lint      # ruff (backend) + eslint (frontend)
make test      # backend pytest
make format    # auto-format backend + frontend
```

- Keep PRs focused; one logical change per PR.
- Match the existing code style (the linters encode most of it).
- Add or update tests when you change behavior.
- Update `README.md` / `.env.example` when you add configuration.

## Commit messages

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`). It keeps the history readable
and makes changelogs easy.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

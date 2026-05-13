# GenomicIR-NLP · Web App

A two-service web application that puts the GenomicIR-NLP pipeline behind a polished UI:

- **Frontend** — Python · Flask + Jinja templates, with a custom genomics theme (animated DNA helix background, gradient accents, glassmorphic panels).
- **Backend** — TypeScript · Fastify, exposing three services:
  - **Retrieve** — BM25 ranking over scraped bioRxiv abstracts.
  - **Summarize** — extractive sentence-scoring summarizer.
  - **Ask** — retrieval-augmented extractive question answering.

The backend loads the corpus from `app/backend/data/papers.csv` (copied from `5_INFORMATION_RETRIEVAL/data/`).
The original Python scripts in the repo were *not* modified.

---

## Folder layout

```
app/
├── backend/                 # Fastify · TypeScript
│   ├── data/papers.csv      # corpus (copied in from 5_INFORMATION_RETRIEVAL)
│   ├── src/
│   │   ├── server.ts
│   │   └── services/
│   │       ├── dataStore.ts
│   │       ├── retrieval.ts     (BM25)
│   │       ├── summarizer.ts    (extractive)
│   │       ├── qa.ts            (retrieval-augmented extractive)
│   │       └── textUtils.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/                # Flask · Python
    ├── app.py
    ├── requirements.txt
    ├── templates/   (base, index, retrieve, summarize, qa, about)
    └── static/
        ├── css/style.css
        └── js/  (helix.js, main.js, retrieve.js, summarize.js, qa.js)
```

---

## Running it

You'll need **Node 18+** and **Python 3.10+**.

### 1) Backend (Fastify, TypeScript)

```bash
cd app/backend
npm install
npm run dev       # http://localhost:3001
```

Or build & run:

```bash
npm run build
npm start
```

Health check:

```bash
curl http://localhost:3001/api/health
```

### 2) Frontend (Flask)

In a separate terminal:

```bash
cd app/frontend
python -m venv .venv
.\.venv\Scripts\activate          # PowerShell on Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python app.py                     # http://localhost:5000
```

By default the frontend talks to `http://localhost:3001`.
Override with the `BACKEND_URL` env var:

```powershell
$env:BACKEND_URL = "http://localhost:3001"; python app.py
```

---

## API reference

| Method | Path                | Body / Query                              | Returns |
|--------|---------------------|-------------------------------------------|---------|
| GET    | `/api/health`       | —                                         | `{ status, papers }` |
| GET    | `/api/stats`        | —                                         | corpus stats |
| GET    | `/api/retrieve`     | `?q=<query>&k=<int>`                      | `{ query, results[] }` |
| POST   | `/api/summarize`    | `{ text?, paperId?, sentences? }`         | `{ summary, paper?, existingSummary? }` |
| POST   | `/api/qa`           | `{ question }`                            | `{ answer, sources[] }` |
| GET    | `/api/paper/:id`    | —                                         | single paper record |

---

## Notes on logic

These implementations are deliberately lightweight (no heavyweight ML downloads required, fully local):

- **Retrieval** — pure BM25 (`k1=1.5`, `b=0.75`) over tokenized title + abstract.
- **Summarization** — score each sentence by mean term-frequency of its non-stopword tokens; return top-N in original order.
- **QA** — retrieve top-K papers, then extract abstract sentences with the highest token overlap with the question and concatenate them as the answer; surface the corresponding papers as citations.

These can be swapped out for the heavier models referenced in the parent project (T5, LLaMA-2, all-MiniLM-L6-v2 + FAISS) by replacing the relevant service module.

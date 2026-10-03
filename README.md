# RAG vs No-RAG Live Demo (React + pgvector)

This project is a live teaching demo for JavaScript trainees. It shows two pipelines side by side:

- RAG mode: chunk PDF -> embed chunks -> store/retrieve with pgvector -> augment prompt -> generate
- No-RAG mode: send full PDF text in prompt every time -> generate

The UI visualizes every step with real timing and keeps run history for immediate comparison.

## Stack

- Frontend: React + Vite + Tailwind
- PDF parsing: pdfjs-dist (client-side)
- Backend: Node + Express
- Vector database: PostgreSQL + pgvector
- LLM + embeddings: OpenAI-compatible API (proxied by backend)

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres + pgvector)
- Gemini API key (`GEMINI_API_KEY`)

## 1) Start PostgreSQL + pgvector

From the repo root:

```bash
docker compose up -d
```

## 2) Configure backend environment

Copy and edit:

```bash
cp server/.env.example server/.env
```

Set at least:

- GEMINI_API_KEY
- EMBEDDING_MODEL (default: text-embedding-004)
- CHAT_MODEL (default: gemini-2.5-flash)
- DATABASE_URL (default points to docker compose postgres)

## 3) Install dependencies

From repo root:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## 4) Run migrations

```bash
npm run db:migrate
```

## 5) Start app (frontend + backend)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8787

## Demo Flow (Presenter Script)

1. Click "Preload sample PDF" or upload your own PDF.
2. Enter a question.
3. Run in RAG mode first.
4. Switch to No RAG mode and run the same question.
5. Open the prompt panel to show context size difference.
6. Use Metrics + Run Comparison to show token/time trade-offs.

## What gets measured

Per run:

- Total wall-clock time
- Per-step elapsed time
- Prompt tokens
- Completion tokens
- Total tokens
- Illustrative cost
- Context characters/tokens sent to model

Notes:

- Token usage uses provider usage when available.
- If usage is missing, UI falls back to an approximate estimator (chars / 4).

## Project Structure

- client/src/components: visual UI pieces
- client/src/hooks: RAG and No-RAG pipeline orchestration
- client/src/lib: chunking, PDF parsing, embedding/LLM API clients
- server/index.js: API routes for embeddings, retrieval, streaming chat, run persistence
- db/migrations: PostgreSQL schema + pgvector setup

## Troubleshooting

- "Failed to start server" with DB error:
  - Ensure docker compose is up and DATABASE_URL is correct.
- Embedding length mismatch:
  - Keep EMBEDDING_MODEL and EMBEDDING_DIMENSION aligned with schema (default 1536).
- API errors:
  - Verify OPENAI_API_KEY and model names.
- Empty PDF text:
  - Some PDFs are scanned images; OCR is not included in this demo.

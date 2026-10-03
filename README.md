# RAG vs No-RAG Visual Pipeline Demo

A modern Next.js visual demonstration comparing **Retrieval-Augmented Generation (RAG)** against **Full-Document Prompting (No-RAG)** using EPAM DIAL API, vector storage (`pgvector`), and interactive metrics visualization.

---

## 🎨 Features & Design

- **Dark Mode Palette**: Crafted using curated high-contrast dark theme colors:
  - **Sea** (`#00F6FF`): Primary accents, active step highlights, RAG indicators.
  - **Mint** (`#00FFF0`): Completed badges, metric numbers, status updates.
  - **Lilac** (`#B896FF`): Section headers, subheadings, No-RAG mode toggles.
  - **Sky** (`#7BA8FF`): Table headers, labels, duration timers.
  - **Night** (`#060606`): Deep baseline dark theme surface background.
- **EPAM Gradient Buttons**: Custom interactive buttons with neon glow effects.
- **Multi-Stage Pipeline Progress Bar**: Real-time horizontal stepper track displaying step-by-step execution status, durations, and stage metrics.
- **EPAM DIAL API Integration**: LLM chat completions with streaming deltas (`text/event-stream`) and token usage tracking.
- **Vector Store**: Document chunking and vector storage via `pgvector` and Gemini Embeddings.
- **Metrics & Comparison**: Real-time token usage, context sizes, latency calculations, and Recharts run comparison graph.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4 & @epam/uui
- **LLM Provider**: EPAM DIAL API (`https://ai-proxy.lab.epam.com`)
- **Embeddings**: Gemini Embeddings (`gemini-embedding-001`)
- **Database / Vector Store**: PostgreSQL with `pgvector` extension
- **Charts & Visualization**: Recharts & Dropzone

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v20 or higher
- **PostgreSQL**: v15+ with `pgvector` extension installed

### 2. Environment Setup

Create or update `.env.local` in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rag_demo

# EPAM DIAL API
DIAL_API_KEY=your-dial-api-key
DIAL_API_BASE_URL=https://ai-proxy.lab.epam.com/openai/deployments/gpt-4/chat/completions

# Embeddings
GEMINI_API_KEY=your-gemini-api-key
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSION=1536
```

### 3. Install & Run Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment (Multi-Stage)

This project includes an optimized multi-stage `Dockerfile` with Next.js standalone output.

### Build & Run Container

```bash
# Build production Docker image
docker build -t rag-demo:latest .

# Run Docker container
docker run -d -p 3000:3000 --env-file .env.local --name rag-demo-app rag-demo:latest
```

---

## 📜 Available Scripts

- `npm run dev`: Starts Next.js development server.
- `npm run build`: Compiles production build and generates standalone bundle.
- `npm start`: Starts production server from build output.
- `npm run lint`: Runs ESLint checks.

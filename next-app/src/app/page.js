'use client'

import { useEffect, useMemo, useState } from 'react'
import ComparisonTable from '@/components/ComparisonTable'
import MetricsPanel from '@/components/MetricsPanel'
import ModeToggle from '@/components/ModeToggle'
import PdfUploader from '@/components/PdfUploader'
import StepVisualizer from '@/components/StepVisualizer'
import { useNoRagPipeline } from '@/hooks/useNoRagPipeline'
import { useRagPipeline } from '@/hooks/useRagPipeline'
import { fetchRuns } from '@/lib/api'
import { parsePdfText } from '@/lib/pdf'

const SAMPLE_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const HISTORY_LIMIT = 8

export default function Home() {
  const [mode, setMode] = useState('RAG')
  const [pdfName, setPdfName] = useState('')
  const [pdfText, setPdfText] = useState('')
  const [question, setQuestion] = useState('What is this document about?')
  const [chunkSize, setChunkSize] = useState(500)
  const [overlap, setOverlap] = useState(50)
  const [topK, setTopK] = useState(4)
  const [uploadProgress, setUploadProgress] = useState('')
  const [appError, setAppError] = useState('')
  const [history, setHistory] = useState([])

  const rag = useRagPipeline()
  const noRag = useNoRagPipeline()

  const activePipeline = mode === 'RAG' ? rag : noRag
  const canRun = Boolean(pdfText && question.trim()) && !activePipeline.isRunning
  const combinedError = appError || activePipeline.error

  const activeMetrics = useMemo(() => {
    return mode === 'RAG' ? rag.metrics : noRag.metrics
  }, [mode, noRag.metrics, rag.metrics])

  useEffect(() => {
    loadRunsFromServer()
  }, [])

  async function loadRunsFromServer() {
    try {
      const result = await fetchRuns()
      const normalized = result.runs.map((run) => ({
        mode: run.mode === 'rag' ? 'RAG' : 'No RAG',
        totalTimeMs: Number(run.total_time_ms),
        promptTokens: Number(run.prompt_tokens),
        completionTokens: Number(run.completion_tokens),
        totalTokens: Number(run.total_tokens),
        contextChars: Number(run.context_chars),
        contextApproxTokens: Number(run.context_approx_tokens),
        timestamp: run.created_at,
      }))

      setHistory(normalized.slice(0, HISTORY_LIMIT))
    } catch (error) {
      setAppError(error.message)
    }
  }

  async function parseAndSet(file) {
    setAppError('')
    setUploadProgress('Parsing PDF...')
    try {
      const text = await parsePdfText(file, ({ pageNumber, numPages }) => {
        setUploadProgress(`Parsing page ${pageNumber}/${numPages}`)
      })

      if (!text.trim()) {
        throw new Error('PDF contained no extractable text.')
      }

      setPdfText(text)
      setPdfName(file.name)
      setUploadProgress(`Loaded ${file.name} (${text.length.toLocaleString()} chars)`)
    } catch (error) {
      setAppError(error.message)
      setUploadProgress('')
    }
  }

  async function preloadSample() {
    setAppError('')
    setUploadProgress('Downloading sample PDF...')
    try {
      const response = await fetch(SAMPLE_PDF)
      const blob = await response.blob()
      const file = new File([blob], 'sample.pdf', { type: 'application/pdf' })
      await parseAndSet(file)
    } catch (error) {
      setAppError(error.message)
      setUploadProgress('')
    }
  }

  async function handleRun() {
    setAppError('')
    if (!pdfText.trim()) {
      setAppError('Please upload a PDF before running the pipeline.')
      return
    }

    if (!question.trim()) {
      setAppError('Question is required.')
      return
    }

    const result =
      mode === 'RAG'
        ? await rag.run({ fileName: pdfName || 'uploaded.pdf', pdfText, question, chunkSize, overlap, topK })
        : await noRag.run({ pdfText, question })

    if (result) {
      await loadRunsFromServer()
    }
  }

  function handleReset() {
    rag.reset()
    noRag.reset()
    setAppError('')
    setUploadProgress('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-cyan-50 text-slate-900">
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:px-8">
        <header className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Next.js + Gemini + pgvector Demo</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight">RAG vs No-RAG Visual Pipeline</h1>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase text-cyan-800">Next.js App Router</span>
          </div>
          <p className="mt-2 text-base text-slate-700">
            Upload a PDF, ask a question, then compare retrieval-augmented generation against full-document prompting.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ModeToggle mode={mode} onChange={setMode} />
            <button
              type="button"
              onClick={preloadSample}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Preload sample PDF
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Reset
            </button>
          </div>
        </header>

        {combinedError ? (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 font-semibold text-rose-700">{combinedError}</div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <PdfUploader fileName={pdfName} onPick={parseAndSet} />

            <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-700">Question</label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about the PDF"
                className="mt-2 h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <LabeledNumberInput label="Chunk size" value={chunkSize} onChange={setChunkSize} disabled={mode !== 'RAG'} />
                <LabeledNumberInput label="Overlap" value={overlap} onChange={setOverlap} disabled={mode !== 'RAG'} />
                <LabeledNumberInput label="Top K" value={topK} onChange={setTopK} disabled={mode !== 'RAG'} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canRun}
                  onClick={handleRun}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {activePipeline.isRunning ? 'Running...' : `Run ${mode}`}
                </button>
                <span className="text-sm font-medium text-slate-600">{uploadProgress}</span>
              </div>
            </div>

            <StepVisualizer steps={activePipeline.steps} />
          </div>

          <div className="space-y-4">
            <MetricsPanel metrics={activeMetrics} />
            <ComparisonTable history={history.slice(0, HISTORY_LIMIT)} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <PromptPanel title="Prompt sent to LLM" text={activePipeline.promptPreview} />
          <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">Generated Answer</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-800">
              {activePipeline.answer || 'Run the pipeline to generate an answer.'}
            </p>
          </section>
        </section>
      </main>
    </div>
  )
}

function LabeledNumberInput({ label, value, onChange, disabled }) {
  return (
    <label className="block">
      <span className="text-sm font-bold uppercase tracking-wide text-slate-700">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
      />
    </label>
  )
}

function PromptPanel({ title, text }) {
  return (
    <details className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-xl font-black text-slate-900">{title}</summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-100">
        {text || 'Prompt will appear after run starts.'}
      </pre>
    </details>
  )
}

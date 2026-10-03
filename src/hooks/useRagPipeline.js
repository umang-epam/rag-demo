'use client'

import { useState } from 'react'
import { chunkText, estimateTokens } from '@/lib/chunking'
import { embedTexts, retrieveTopK, upsertVectors } from '@/lib/embeddings'
import { streamChat } from '@/lib/llm'
import { buildRagContext, formatTopMatches } from '@/lib/vectorStore'
import { saveRun } from '@/lib/api'

const STEP_IDS = [
  'parse',
  'chunk',
  'embed_chunks',
  'index',
  'embed_query',
  'retrieve',
  'augment',
  'generate',
  'done',
]

const STEP_LABELS = {
  parse: 'Parsing PDF',
  chunk: 'Chunking document',
  embed_chunks: 'Embedding chunks',
  index: 'Indexing into vector store',
  embed_query: "Embedding user's query",
  retrieve: 'Retrieving top-K relevant chunks',
  augment: 'Augmenting prompt with retrieved context',
  generate: 'Generating answer',
  done: 'Done',
}

function createSteps() {
  return STEP_IDS.map((id) => ({
    id,
    label: STEP_LABELS[id],
    status: 'pending',
    durationMs: 0,
    details: '',
  }))
}

function updateStep(steps, stepId, patch) {
  return steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step))
}

export function useRagPipeline() {
  const [steps, setSteps] = useState(createSteps())
  const [answer, setAnswer] = useState('')
  const [promptPreview, setPromptPreview] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setSteps(createSteps())
    setAnswer('')
    setPromptPreview('')
    setMetrics(null)
    setError('')
  }

  async function run({ fileName, pdfText, question, chunkSize, overlap, topK }) {
    if (isRunning) {
      return null
    }

    setIsRunning(true)
    setError('')
    setAnswer('')
    setPromptPreview('')
    setMetrics(null)
    setSteps(createSteps())

    const runStart = performance.now()
    const stepTimings = {}

    const runStep = async (stepId, task, onSuccessDetails) => {
      const started = performance.now()
      setSteps((current) =>
        updateStep(current, stepId, {
          status: 'running',
          details: 'Working...',
          durationMs: 0,
        }),
      )

      const result = await task()

      const durationMs = performance.now() - started
      stepTimings[stepId] = durationMs
      setSteps((current) =>
        updateStep(current, stepId, {
          status: 'done',
          durationMs,
          details: onSuccessDetails?.(result) || 'Completed',
        }),
      )

      return result
    }

    try {
      await runStep('parse', async () => pdfText, (text) => `${text.length.toLocaleString()} chars`)

      const chunks = await runStep(
        'chunk',
        async () => chunkText(pdfText, chunkSize, overlap),
        (chunkList) => `${chunkList.length} chunks`,
      )

      const embeddedChunks = await runStep(
        'embed_chunks',
        async () => {
          const { embeddings } = await embedTexts(chunks)
          return chunks.map((chunk, index) => ({
            chunkIndex: index,
            chunkText: chunk,
            embedding: embeddings[index],
          }))
        },
        (results) => `${results.length}/${results.length} vectors created`,
      )

      await runStep(
        'index',
        async () =>
          upsertVectors({
            documentName: `${fileName}-${Date.now()}`,
            sourceText: pdfText,
            chunks: embeddedChunks,
          }),
        (indexed) => `${indexed.chunksInserted} indexed`,
      )

      const queryEmbedding = await runStep(
        'embed_query',
        async () => {
          const { embeddings } = await embedTexts([question])
          return embeddings[0]
        },
        () => 'Query embedded',
      )

      const topMatches = await runStep(
        'retrieve',
        async () => retrieveTopK(queryEmbedding, topK),
        (matches) =>
          formatTopMatches(matches)
            .map((item) => `#${item.chunkIndex} (${item.score})`)
            .join(', '),
      )

      const context = buildRagContext(topMatches)
      const prompt = `You are a helpful assistant answering only from retrieved PDF context.\n\nContext:\n${context}\n\nQuestion:\n${question}`

      await runStep(
        'augment',
        async () => {
          setPromptPreview(prompt)
          return prompt
        },
        () => `${estimateTokens(context)} context tokens (approx)`,
      )

      const messages = [
        {
          role: 'system',
          content:
            'Answer from the provided context. If the answer is unknown from context, say that clearly.',
        },
        { role: 'user', content: prompt },
      ]

      const generatedResult = await runStep(
        'generate',
        async () => {
          let generated = ''
          const streamResult = await streamChat({
            messages,
            onDelta: (delta) => {
              generated += delta
              setAnswer(generated)
            },
          })
          return { usage: streamResult.usage || null, generated }
        },
        () => 'Answer streamed',
      )

      setAnswer(generatedResult.generated)

      await runStep('done', async () => true, () => 'Final answer ready')

      const promptTokens = generatedResult.usage?.prompt_tokens || estimateTokens(prompt)
      const completionTokens =
        generatedResult.usage?.completion_tokens || estimateTokens(generatedResult.generated)
      const totalTokens = generatedResult.usage?.total_tokens || promptTokens + completionTokens
      const contextChars = context.length
      const contextApproxTokens = estimateTokens(context)
      const totalTimeMs = performance.now() - runStart
      const costPer1k = 0.002
      const estimatedCost = (totalTokens / 1000) * costPer1k

      const finalMetrics = {
        mode: 'RAG',
        totalTimeMs,
        stepTimings,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        contextChars,
        contextApproxTokens,
        promptPreview: prompt,
        answer: generatedResult.generated,
        question,
        timestamp: new Date().toISOString(),
      }

      setMetrics(finalMetrics)

      await saveRun({
        mode: 'rag',
        question,
        totalTimeMs,
        promptTokens,
        completionTokens,
        totalTokens,
        contextChars,
        contextApproxTokens,
      })

      return finalMetrics
    } catch (err) {
      setError(err.message || 'RAG pipeline failed')
      setSteps((current) => {
        const runningStep = current.find((step) => step.status === 'running')
        if (!runningStep) {
          return current
        }
        return updateStep(current, runningStep.id, {
          status: 'error',
          details: err.message || 'Step failed',
        })
      })
      return null
    } finally {
      setIsRunning(false)
    }
  }

  return {
    steps,
    answer,
    promptPreview,
    metrics,
    isRunning,
    error,
    run,
    reset,
  }
}

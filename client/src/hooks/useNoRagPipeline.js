import { useState } from 'react'
import { estimateTokens } from '../lib/chunking'
import { streamChat } from '../lib/llm'
import { saveRun } from '../lib/api'

const STEP_IDS = ['parse', 'extract', 'send_full', 'generate', 'done']

const STEP_LABELS = {
  parse: 'Parsing PDF',
  extract: 'Extracting full text',
  send_full: 'Sending full document + question to LLM as context',
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

export function useNoRagPipeline() {
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

  async function run({ pdfText, question }) {
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

      const extracted = await runStep(
        'extract',
        async () => pdfText,
        (text) => `${text.length.toLocaleString()} chars / ${estimateTokens(text)} tokens (approx)`,
      )

      const prompt = `You are a helpful assistant. Use the full PDF text to answer the question.\n\nFull document:\n${extracted}\n\nQuestion:\n${question}`

      await runStep(
        'send_full',
        async () => {
          setPromptPreview(prompt)
          return prompt
        },
        () => `${estimateTokens(prompt)} prompt tokens (approx)`,
      )

      const messages = [
        { role: 'system', content: 'Answer the question from the full document context.' },
        { role: 'user', content: prompt },
      ]

      const usage = await runStep(
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
          return { usage: streamResult.usage, generated }
        },
        () => 'Answer streamed',
      )

      const finalAnswer = usage.generated
      setAnswer(finalAnswer)

      await runStep('done', async () => true, () => 'Final answer ready')

      const promptTokens = usage.usage?.prompt_tokens || estimateTokens(prompt)
      const completionTokens = usage.usage?.completion_tokens || estimateTokens(finalAnswer)
      const totalTokens = usage.usage?.total_tokens || promptTokens + completionTokens
      const contextChars = extracted.length
      const contextApproxTokens = estimateTokens(extracted)
      const totalTimeMs = performance.now() - runStart
      const costPer1k = 0.002
      const estimatedCost = (totalTokens / 1000) * costPer1k

      const finalMetrics = {
        mode: 'No RAG',
        totalTimeMs,
        stepTimings,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        contextChars,
        contextApproxTokens,
        promptPreview: prompt,
        answer: finalAnswer,
        question,
        timestamp: new Date().toISOString(),
      }

      setMetrics(finalMetrics)

      await saveRun({
        mode: 'no-rag',
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
      setError(err.message || 'No-RAG pipeline failed')
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

'use client'

import { useMemo } from 'react'

export default function StepVisualizer({ steps }) {
  const { doneCount, totalSteps, progressPercent, runningStep, errorStep } = useMemo(() => {
    const total = steps.length || 1
    const done = steps.filter((s) => s.status === 'done').length
    const running = steps.find((s) => s.status === 'running')
    const error = steps.find((s) => s.status === 'error')
    const pct = Math.round((done / total) * 100)
    return {
      doneCount: done,
      totalSteps: total,
      progressPercent: pct,
      runningStep: running,
      errorStep: error,
    }
  }, [steps])

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 sm:p-6 shadow-xl">
      {/* Top Title & Overall Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-[#00F6FF]">Pipeline Progress</h2>
            <span className="rounded-full bg-[#00F6FF]/10 border border-[#00F6FF]/30 px-3 py-0.5 text-xs font-bold text-[#00F6FF]">
              {progressPercent}% Complete
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {runningStep
              ? `Executing step: ${runningStep.label}...`
              : errorStep
              ? `Pipeline stopped at: ${errorStep.label}`
              : doneCount === totalSteps
              ? 'All pipeline stages finished successfully'
              : 'Pipeline ready'}
          </p>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Stage <span className="text-[#00FFF0]">{doneCount}</span> of <span className="text-zinc-200">{totalSteps}</span>
        </div>
      </div>

      {/* Main Multi-Stage Progress Bar Track */}
      <div className="mt-5">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800/80 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#00F6FF] via-[#00FFF0] to-[#7BA8FF] ${
              runningStep ? 'animate-pulse shadow-[0_0_12px_rgba(0,246,255,0.6)]' : ''
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Horizontal Multi-Stage Node Stepper Track */}
      <div className="mt-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="flex items-start justify-between min-w-[640px] px-2 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1
            const isDone = step.status === 'done'
            const isRunning = step.status === 'running'
            const isError = step.status === 'error'
            const isPending = step.status === 'pending'

            // Connector line status to the next node
            const nextStep = steps[idx + 1]
            const lineFilled = isDone || (isRunning && nextStep?.status === 'done')

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center relative group">
                {/* Connecting Line to next step */}
                {!isLast && (
                  <div className="absolute top-4 left-[50%] right-[-50%] h-[3px] z-0">
                    <div className="h-full bg-zinc-800 w-full" />
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00F6FF] to-[#00FFF0] transition-all duration-300"
                      style={{ width: lineFilled ? '100%' : '0%' }}
                    />
                  </div>
                )}

                {/* Stage Node Circle */}
                <div
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-[#00FFF0] text-[#060606] shadow-[0_0_12px_rgba(0,255,240,0.5)] scale-100'
                      : isRunning
                      ? 'bg-[#00F6FF] text-[#060606] shadow-[0_0_18px_rgba(0,246,255,0.8)] scale-110 animate-pulse ring-4 ring-[#00F6FF]/20'
                      : isError
                      ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {isDone ? (
                    '✓'
                  ) : isRunning ? (
                    <span className="animate-spin text-sm">↻</span>
                  ) : isError ? (
                    '!'
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Node Label & Timing */}
                <div className="mt-2 text-center max-w-[90px]">
                  <p
                    className={`text-xs font-semibold truncate transition-colors ${
                      isRunning
                        ? 'text-[#00F6FF]'
                        : isDone
                        ? 'text-zinc-100'
                        : isError
                        ? 'text-red-400'
                        : 'text-zinc-500'
                    }`}
                    title={step.label}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono text-[#7BA8FF]">
                    {step.durationMs ? `${step.durationMs.toFixed(0)}ms` : isRunning ? 'active' : '-'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage Detail Cards Grid */}
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, idx) => {
          const isDone = step.status === 'done'
          const isRunning = step.status === 'running'
          const isError = step.status === 'error'

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-3 transition-all duration-200 ${
                isRunning
                  ? 'border-[#00F6FF] bg-[#00F6FF]/5 shadow-[0_0_15px_rgba(0,246,255,0.15)]'
                  : isDone
                  ? 'border-zinc-800 bg-[#18181b] hover:border-zinc-700'
                  : isError
                  ? 'border-red-500/40 bg-red-500/5'
                  : 'border-zinc-800/60 bg-[#121214]/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isDone
                        ? 'bg-[#00FFF0]'
                        : isRunning
                        ? 'bg-[#00F6FF] animate-ping'
                        : isError
                        ? 'bg-red-500'
                        : 'bg-zinc-600'
                    }`}
                  />
                  <span className="text-xs font-bold truncate text-zinc-200" title={step.label}>
                    {idx + 1}. {step.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#7BA8FF] shrink-0">
                  {step.durationMs ? `${step.durationMs.toFixed(1)} ms` : '-'}
                </span>
              </div>
              {step.details ? (
                <p className="mt-1.5 text-xs text-zinc-400 line-clamp-1 font-mono">{step.details}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

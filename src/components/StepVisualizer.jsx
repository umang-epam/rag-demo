'use client'

function StepItem({ step }) {
  const statusClass = {
    pending: 'bg-slate-200 text-slate-700',
    running: 'bg-blue-100 text-blue-700 animate-pulse',
    done: 'bg-emerald-100 text-emerald-700',
    error: 'bg-rose-100 text-rose-700',
  }[step.status]

  const symbol = {
    pending: '•',
    running: '↻',
    done: '✓',
    error: '!',
  }[step.status]

  return (
    <li className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${statusClass}`}>
            {symbol}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{step.label}</p>
            <p className="text-sm text-slate-600">{step.details}</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-slate-700">{step.durationMs ? `${step.durationMs.toFixed(1)} ms` : '-'}</span>
      </div>
    </li>
  )
}

export default function StepVisualizer({ steps }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
      <h2 className="text-2xl font-black text-slate-900">Pipeline Steps</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <StepItem key={step.id} step={step} />
        ))}
      </ol>
    </section>
  )
}

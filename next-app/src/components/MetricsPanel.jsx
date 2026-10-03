export default function MetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <section className="rounded-2xl border border-slate-300 bg-white p-4">
        <h2 className="text-2xl font-black text-slate-900">Metrics</h2>
        <p className="mt-2 text-slate-600">Run a pipeline to see timing and token metrics.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-4">
      <h2 className="text-2xl font-black text-slate-900">Metrics ({metrics.mode})</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <MetricRow label="Total time" value={`${metrics.totalTimeMs.toFixed(1)} ms`} />
        <MetricRow label="Prompt tokens" value={metrics.promptTokens.toLocaleString()} />
        <MetricRow label="Completion tokens" value={metrics.completionTokens.toLocaleString()} />
        <MetricRow label="Total tokens" value={metrics.totalTokens.toLocaleString()} />
        <MetricRow label="Context chars" value={metrics.contextChars.toLocaleString()} />
        <MetricRow label="Context tokens (approx)" value={metrics.contextApproxTokens.toLocaleString()} />
        <MetricRow label="Illustrative cost" value={`$${metrics.estimatedCost.toFixed(4)}`} />
      </div>
    </section>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  )
}

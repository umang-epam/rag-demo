export default function MetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 shadow-lg">
        <h2 className="text-2xl font-black text-[#B896FF]">Metrics</h2>
        <p className="mt-2 text-zinc-400">Run a pipeline to see timing and token metrics.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 shadow-lg">
      <h2 className="text-2xl font-black text-[#B896FF]">Metrics ({metrics.mode})</h2>
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
    <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-3 transition-colors hover:border-zinc-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#7BA8FF]">{label}</p>
      <p className="text-xl font-black text-[#00FFF0]">{value}</p>
    </div>
  )
}

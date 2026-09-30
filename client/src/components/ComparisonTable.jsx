import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function ComparisonTable({ history }) {
  if (!history.length) {
    return (
      <section className="rounded-2xl border border-slate-300 bg-white p-4">
        <h2 className="text-2xl font-black text-slate-900">Run Comparison</h2>
        <p className="mt-2 text-slate-600">Run both modes to unlock side-by-side comparison.</p>
      </section>
    )
  }

  const chartData = history
    .slice(0, 6)
    .map((run) => ({
      mode: run.mode,
      totalTokens: run.totalTokens,
      totalTimeMs: Math.round(run.totalTimeMs),
    }))
    .reverse()

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-4">
      <h2 className="text-2xl font-black text-slate-900">Run Comparison</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm uppercase tracking-wide text-slate-600">
              <th className="py-2">Mode</th>
              <th className="py-2">Total Time</th>
              <th className="py-2">Prompt Tokens</th>
              <th className="py-2">Total Tokens</th>
            </tr>
          </thead>
          <tbody>
            {history.map((run, index) => (
              <tr key={`${run.timestamp}-${index}`} className="border-b border-slate-100 text-slate-900">
                <td className="py-2 font-bold">{run.mode}</td>
                <td className="py-2">{run.totalTimeMs.toFixed(1)} ms</td>
                <td className="py-2">{run.promptTokens.toLocaleString()}</td>
                <td className="py-2">{run.totalTokens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mode" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalTokens" fill="#2563eb" name="Total Tokens" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'

export default function ComparisonTable({ history }) {
  if (!history.length) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 shadow-lg">
        <h2 className="text-2xl font-black text-[#00F6FF]">Run Comparison</h2>
        <p className="mt-2 text-zinc-400">Run both modes to unlock side-by-side comparison.</p>
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
    <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 shadow-lg">
      <h2 className="text-2xl font-black text-[#00F6FF]">Run Comparison</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-[#7BA8FF]">
              <th className="py-2">Mode</th>
              <th className="py-2">Total Time</th>
              <th className="py-2">Prompt Tokens</th>
              <th className="py-2">Total Tokens</th>
            </tr>
          </thead>
          <tbody>
            {history.map((run, index) => (
              <tr key={`${run.timestamp}-${index}`} className="border-b border-zinc-800/60 text-zinc-200 text-sm hover:bg-[#18181c]">
                <td className="py-2.5 font-bold text-zinc-100">{run.mode}</td>
                <td className="py-2.5">{run.totalTimeMs.toFixed(1)} ms</td>
                <td className="py-2.5">{run.promptTokens.toLocaleString()}</td>
                <td className="py-2.5">{run.totalTokens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="mode" stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} />
            <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa' }} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f3f4f6', borderRadius: '0.5rem' }}
            />
            <Bar dataKey="totalTokens" name="Total Tokens" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.mode === 'RAG' ? '#00F6FF' : '#B896FF'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

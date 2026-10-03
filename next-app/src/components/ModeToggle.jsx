'use client'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1 text-lg font-semibold">
      {['RAG', 'No RAG'].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-lg px-4 py-2 transition ${
            mode === item ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

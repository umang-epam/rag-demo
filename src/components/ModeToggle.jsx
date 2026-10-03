'use client'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-800 bg-[#121214] p-1 text-base font-semibold shadow-inner">
      {['RAG', 'No RAG'].map((item) => {
        const isActive = mode === item
        const activeBg =
          item === 'RAG'
            ? 'bg-[#00F6FF] text-[#060606] font-bold shadow-[0_0_12px_rgba(0,246,255,0.4)]'
            : 'bg-[#B896FF] text-[#060606] font-bold shadow-[0_0_12px_rgba(184,150,255,0.4)]'
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-lg px-4 py-2 transition-all duration-200 ${
              isActive ? activeBg : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

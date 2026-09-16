// src/components/ReasoningTrace.tsx
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TraceEntry {
  id: string
  kind: 'tool_call' | 'tool_result' | 'reasoning'
  text: string
}

interface Props { entries: TraceEntry[]; active: boolean }

const KIND_STYLE: Record<string, string> = {
  tool_call:   'text-genomic-cyan',
  tool_result: 'text-genomic-amber/80',
  reasoning:   'text-white/70',
}

export default function ReasoningTrace({ entries, active }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  return (
    <div className="glass rounded-2xl p-4 h-full overflow-y-auto font-mono text-xs leading-relaxed">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-genomic-cyan animate-pulse' : 'bg-white/20'}`} />
        <span className="text-white/40 text-xs">Agent Reasoning</span>
      </div>
      <AnimatePresence initial={false}>
        {entries.map(e => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-1 ${KIND_STYLE[e.kind]}`}>
            {e.kind === 'tool_call'   && <span className="text-white/30 mr-1">▶</span>}
            {e.kind === 'tool_result' && <span className="text-white/30 mr-1">◀</span>}
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
      {active && <span className="inline-block w-1.5 h-4 bg-genomic-cyan animate-pulse ml-0.5" />}
      <div ref={bottomRef} />
    </div>
  )
}

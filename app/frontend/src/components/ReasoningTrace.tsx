import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TraceEntry {
  id: string
  kind: 'tool_call' | 'tool_result' | 'reasoning'
  text: string
}

interface Props { entries: TraceEntry[]; active: boolean }

const KIND_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  tool_call:   { color: 'text-genomic-cyan',    bg: 'bg-genomic-cyan/10',   icon: '⚙', label: 'Tool call' },
  tool_result: { color: 'text-genomic-amber',   bg: 'bg-genomic-amber/10',  icon: '✓', label: 'Tool result' },
  reasoning:   { color: 'text-white/60',        bg: 'bg-white/5',           icon: '·', label: 'Reasoning' },
}

export default function ReasoningTrace({ entries, active }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  return (
    <section
      className="glass rounded-2xl p-4 h-full overflow-y-auto"
      aria-label="Agent reasoning trace"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-genomic-cyan animate-pulse' : 'bg-white/20'}`}
          aria-hidden="true"
        />
        <span className="text-white/40 text-xs font-mono">Agent Reasoning</span>
        <span className="ml-auto text-white/20 text-xs font-mono">{entries.length} steps</span>
        {active && <span className="sr-only">Agent is currently processing your query</span>}
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {entries.map(e => {
            const cfg = KIND_CONFIG[e.kind]
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-2 rounded-lg px-2 py-1.5 ${cfg.bg}`}
              >
                <span className={`shrink-0 font-mono text-xs mt-0.5 ${cfg.color}`} aria-hidden="true">
                  {cfg.icon}
                </span>
                <span className="sr-only">{cfg.label}: </span>
                <span className={`font-mono text-xs leading-relaxed ${cfg.color} break-words min-w-0`}>
                  {e.text}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {active && (
        <div className="flex items-center gap-2 mt-2 px-2">
          <span className="inline-block w-1.5 h-3.5 bg-genomic-cyan animate-pulse rounded-sm" aria-hidden="true" />
          <span className="text-white/30 text-xs font-mono">thinking…</span>
        </div>
      )}

      {entries.length === 0 && !active && (
        <p className="text-white/20 text-xs font-mono text-center py-8">No trace entries yet</p>
      )}

      <div ref={bottomRef} />
    </section>
  )
}

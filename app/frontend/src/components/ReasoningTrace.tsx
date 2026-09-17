import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TraceEntry {
  id: string
  kind: 'tool_call' | 'tool_result' | 'reasoning'
  text: string
}

interface Props { entries: TraceEntry[]; active: boolean }

const KIND_CONFIG = {
  tool_call:   { color: 'text-genomic-cyan',    bg: 'bg-genomic-cyan/[0.07]',    border: 'border-genomic-cyan/10',    prefix: '⚙', label: 'Tool call' },
  tool_result: { color: 'text-genomic-emerald', bg: 'bg-genomic-emerald/[0.06]', border: 'border-genomic-emerald/10', prefix: '✓', label: 'Tool result' },
  reasoning:   { color: 'text-white/50',        bg: 'bg-white/[0.025]',          border: 'border-white/[0.04]',       prefix: '·', label: 'Reasoning' },
} as const

export default function ReasoningTrace({ entries, active }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [entries])

  return (
    <section
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: 'rgba(4,8,15,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 0 0 1px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
      aria-label="Agent reasoning trace"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
           style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-genomic-rose/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-genomic-amber/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-genomic-emerald/40" />
        </div>
        <span className="text-[10px] font-mono text-white/25 ml-1.5">agent.reasoning_trace</span>
        <div className="ml-auto flex items-center gap-2">
          {active && (
            <span className="text-[9px] font-mono text-genomic-cyan flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-genomic-cyan animate-pulse" />
              live
            </span>
          )}
          <span className="text-[10px] font-mono text-white/20">{entries.length} steps</span>
        </div>
        {active && <span className="sr-only">Agent is currently processing your query</span>}
      </div>

      {/* Trace entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
        <AnimatePresence initial={false}>
          {entries.map((e, i) => {
            const cfg = KIND_CONFIG[e.kind]
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-2.5 rounded-lg px-3 py-2 ${cfg.bg} border ${cfg.border}`}
              >
                {/* Line number */}
                <span className="shrink-0 text-white/15 select-none w-4 text-right">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/* Kind prefix */}
                <span className={`shrink-0 ${cfg.color} mt-px`} aria-hidden="true">
                  {cfg.prefix}
                </span>
                <span className="sr-only">{cfg.label}: </span>
                {/* Text */}
                <span className={`${cfg.color} leading-relaxed break-words min-w-0 flex-1`}>
                  {e.text}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {active && (
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-white/20 w-4 text-right select-none">
              {String(entries.length + 1).padStart(2, '0')}
            </span>
            <span className="inline-block w-1.5 h-3.5 bg-genomic-cyan/60 rounded-sm animate-pulse" aria-hidden="true" />
            <span className="text-white/25">thinking…</span>
          </div>
        )}

        {entries.length === 0 && !active && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-white/10 text-2xl select-none">_</div>
            <p className="text-white/15 text-center">Awaiting query…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </section>
  )
}

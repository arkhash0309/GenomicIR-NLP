import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, ChevronRight, LoaderCircle } from 'lucide-react'
import { Disclosure, DisclosureContent, DisclosureTrigger } from './ui/disclosure'
import { toolLabel, type TraceStep } from '../lib/trace'
import { cn } from '../lib/utils'

interface Props { steps: TraceStep[]; active: boolean }

/** One-line summary of a tool call's arguments, e.g. `"BRCA1 breast cancer" · k=5`. */
function summarizeInput(input: Record<string, unknown>): string {
  return Object.entries(input)
    .map(([k, v]) => (typeof v === 'string' ? `"${v}"` : `${k}=${JSON.stringify(v)}`))
    .join(' · ')
}

function prettyResult(result: string): string {
  try { return JSON.stringify(JSON.parse(result), null, 2) } catch { return result }
}

function ToolStep({ step }: { step: Extract<TraceStep, { kind: 'tool' }> }) {
  const [open, setOpen] = useState(false)
  const done = step.result !== undefined

  return (
    <Disclosure open={open} onOpenChange={setOpen} transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                className="rounded-lg border border-line bg-surface">
      <DisclosureTrigger>
        <button type="button" className="flex w-full items-center gap-2.5 px-3 py-2 text-left">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
            {done
              ? <Check size={14} className="text-success" />
              : <LoaderCircle size={14} className="animate-spin text-subtle" />}
          </span>
          <span className="shrink-0 text-sm font-medium">{toolLabel(step.tool)}</span>
          <span className="min-w-0 truncate font-mono text-xs text-subtle">{summarizeInput(step.input)}</span>
          <ChevronRight
            size={14}
            className={cn('ml-auto shrink-0 text-subtle transition-transform', open && 'rotate-90')}
            aria-hidden="true"
          />
          <span className="sr-only">{done ? '(finished)' : '(running)'}</span>
        </button>
      </DisclosureTrigger>
      <DisclosureContent>
        <div className="space-y-2 border-t border-line px-3 py-2.5 text-xs">
          <div>
            <p className="eyebrow mb-1">Call</p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-muted">
              {step.tool}({JSON.stringify(step.input, null, 2)})
            </pre>
          </div>
          <div>
            <p className="eyebrow mb-1">Result{done && step.result!.length >= 300 ? ' (truncated)' : ''}</p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-muted">
              {done ? prettyResult(step.result!) : 'Waiting for result…'}
            </pre>
          </div>
        </div>
      </DisclosureContent>
    </Disclosure>
  )
}

export default function ReasoningTrace({ steps, active }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const toolCount = steps.filter(s => s.kind === 'tool').length
  // Text after the last tool call is the answer itself, streamed into the
  // answer card — don't show it twice.
  const visible = steps[steps.length - 1]?.kind === 'reasoning' ? steps.slice(0, -1) : steps

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [steps])

  return (
    <section className="card flex h-full min-h-0 flex-col" aria-labelledby="trace-heading">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
        <h2 id="trace-heading" className="text-sm font-semibold">Steps</h2>
        <span className="text-xs text-subtle tabular-nums">
          {toolCount} tool call{toolCount === 1 ? '' : 's'}
        </span>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {visible.map(step => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {step.kind === 'tool'
                ? <ToolStep step={step} />
                : <p className="px-1 text-sm leading-relaxed text-muted">{step.text}</p>}
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-subtle">
            {active ? 'Planning…' : 'Tool calls and intermediate reasoning will appear here.'}
          </p>
        )}
      </div>
    </section>
  )
}

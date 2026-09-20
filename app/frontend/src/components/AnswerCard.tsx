import { motion } from 'framer-motion'
import CopyButton from './CopyButton'
import MarkdownContent from './MarkdownContent'

interface Props { answer: string }

export default function AnswerCard({ answer }: Props) {
  if (!answer) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl mt-4 overflow-hidden"
      style={{
        background: 'rgba(4,8,15,0.6)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 0 0 1px rgba(6,182,212,0.08), 0 16px 48px rgba(0,0,0,0.3)',
      }}
      aria-label="Research answer"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b"
           style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,182,212,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-genomic-cyan animate-pulse" />
          <h2 className="text-genomic-cyan font-semibold text-xs font-mono tracking-[0.15em] uppercase"
              id="answer-heading">
            Answer
          </h2>
        </div>
        <CopyButton
          text={answer}
          label="Copy answer"
          className="text-white/25 hover:text-white/55 px-2.5 py-1 glass rounded-lg text-xs transition-colors"
        />
      </div>

      {/* Body */}
      <div className="px-6 py-5" aria-labelledby="answer-heading">
        <MarkdownContent content={answer} />
      </div>
    </motion.section>
  )
}

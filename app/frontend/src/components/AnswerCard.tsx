import { motion } from 'framer-motion'
import CopyButton from './CopyButton'
import MarkdownContent from './MarkdownContent'

interface Props { answer: string; citations: string[] }

export default function AnswerCard({ answer, citations }: Props) {
  if (!answer) return null

  const fullText = citations.length > 0
    ? `${answer}\n\nCitations:\n${citations.map(doi => `https://doi.org/${doi}`).join('\n')}`
    : answer

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
          text={fullText}
          label="Copy answer"
          className="text-white/25 hover:text-white/55 px-2.5 py-1 glass rounded-lg text-xs transition-colors"
        />
      </div>

      {/* Body */}
      <div className="px-6 py-5" aria-labelledby="answer-heading">
        <MarkdownContent content={answer} />
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="px-6 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/30 mb-3"
              id="citations-heading">
            Citations ({citations.length})
          </h3>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-labelledby="citations-heading">
            {citations.map(doi => (
              <li key={doi}>
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-genomic-cyan/70 hover:text-genomic-cyan bg-genomic-cyan/8 hover:bg-genomic-cyan/12 px-2.5 py-1 rounded-lg font-mono transition-all border border-genomic-cyan/10 hover:border-genomic-cyan/25"
                  aria-label={`View citation DOI ${doi} (opens in new tab)`}
                  style={{ background: 'rgba(6,182,212,0.07)' }}
                >
                  {doi}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  )
}

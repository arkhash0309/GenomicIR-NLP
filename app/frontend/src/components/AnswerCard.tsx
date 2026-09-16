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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mt-4"
      aria-label="Research answer"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-genomic-cyan font-semibold text-sm" id="answer-heading">Answer</h2>
        <CopyButton
          text={fullText}
          label="Copy answer"
          className="text-white/30 hover:text-white/60 px-2 py-1 glass rounded-lg text-xs"
        />
      </div>
      <div aria-labelledby="answer-heading">
        <MarkdownContent content={answer} />
      </div>
      {citations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <h3 className="text-white/40 text-xs mb-3 font-medium uppercase tracking-wider" id="citations-heading">
            Citations ({citations.length})
          </h3>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-labelledby="citations-heading">
            {citations.map(doi => (
              <li key={doi}>
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan bg-genomic-cyan/10 px-2 py-1 rounded font-mono transition-colors"
                  aria-label={`View citation DOI ${doi} (opens in new tab)`}
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

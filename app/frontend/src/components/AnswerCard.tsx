import { motion } from 'framer-motion'

interface Props { answer: string; citations: string[] }

export default function AnswerCard({ answer, citations }: Props) {
  if (!answer) return null
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mt-4"
      aria-label="Research answer"
      aria-live="polite"
      aria-atomic="false"
    >
      <h2 className="text-genomic-cyan font-semibold text-sm mb-3" id="answer-heading">Answer</h2>
      <p className="text-white/90 leading-relaxed whitespace-pre-wrap" aria-labelledby="answer-heading">
        {answer}
      </p>
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-white/40 text-xs mb-2" id="citations-heading">
            Citations ({citations.length})
          </h3>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-labelledby="citations-heading">
            {citations.map(doi => (
              <li key={doi}>
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan bg-genomic-cyan/10 px-2 py-1 rounded font-mono"
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

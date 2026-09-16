// src/components/AnswerCard.tsx
import { motion } from 'framer-motion'

interface Props { answer: string; citations: string[] }

export default function AnswerCard({ answer, citations }: Props) {
  if (!answer) return null
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mt-4">
      <h3 className="text-genomic-cyan font-semibold text-sm mb-3">Answer</h3>
      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{answer}</p>
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs mb-2">Citations</p>
          <div className="flex flex-wrap gap-2">
            {citations.map(doi => (
              <a key={doi} href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer"
                className="text-xs text-genomic-cyan/80 hover:text-genomic-cyan bg-genomic-cyan/10 px-2 py-1 rounded font-mono">
                {doi}
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

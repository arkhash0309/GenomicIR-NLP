interface Props {
  content: string
  className?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function parseInline(text: string): string {
  const safe = escapeHtml(text)
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-genomic-cyan font-mono text-sm">$1</code>')
}

export default function MarkdownContent({ content, className = '' }: Props) {
  const paragraphs = content.split(/\n{2,}/)

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim()
        if (!trimmed) return null

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-white font-semibold text-base mt-4"
                dangerouslySetInnerHTML={{ __html: parseInline(trimmed.slice(4)) }} />
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="text-white font-semibold text-lg mt-4"
                dangerouslySetInnerHTML={{ __html: parseInline(trimmed.slice(3)) }} />
          )
        }

        const lines = trimmed.split('\n')
        const isList = lines.every(l => l.startsWith('- ') || l.startsWith('* ') || /^\d+\. /.test(l))
        if (isList) {
          const isOrdered = /^\d+\. /.test(lines[0])
          const Tag = isOrdered ? 'ol' : 'ul'
          return (
            <Tag key={i} className={`pl-5 space-y-1 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
              {lines.map((l, j) => (
                <li key={j} className="text-white/80 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseInline(l.replace(/^[-*] /, '').replace(/^\d+\. /, '')) }} />
              ))}
            </Tag>
          )
        }

        return (
          <p key={i} className="text-white/90 leading-relaxed"
             dangerouslySetInnerHTML={{ __html: parseInline(trimmed.replace(/\n/g, ' ')) }} />
        )
      })}
    </div>
  )
}

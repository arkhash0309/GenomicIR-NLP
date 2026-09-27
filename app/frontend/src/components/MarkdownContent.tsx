import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

// A deliberately small Markdown subset (headings, lists, bold, italics, code)
// rendered to React nodes — no innerHTML — so plain-text runs can be passed
// through `renderText` (used to turn DOIs into citation markers).

type RenderText = (text: string, key: string) => ReactNode

interface Props {
  content: string
  className?: string
  renderText?: RenderText
}

const INLINE = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g

function renderInline(text: string, keyPrefix: string, renderText: RenderText): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0
    if (start > last) out.push(renderText(text.slice(last, start), `${keyPrefix}-t${i}`))
    const key = `${keyPrefix}-m${i}`
    if (m[2] !== undefined) out.push(<strong key={key} className="font-semibold text-fg">{renderInline(m[2], key, renderText)}</strong>)
    else if (m[3] !== undefined) out.push(<em key={key}>{renderInline(m[3], key, renderText)}</em>)
    else out.push(<code key={key} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">{m[4]}</code>)
    last = start + m[0].length
    i++
  }
  if (last < text.length) out.push(renderText(text.slice(last), `${keyPrefix}-t${i}`))
  return out
}

const plain: RenderText = text => text

export default function MarkdownContent({ content, className, renderText = plain }: Props) {
  const blocks = content.split(/\n{2,}/)

  return (
    <div className={cn('space-y-3 text-[15px] leading-7 text-fg', className)}>
      {blocks.map((block, i) => {
        const trimmed = block.trim()
        if (!trimmed) return null
        const key = `b${i}`

        const heading = /^(#{2,3}) (.*)$/.exec(trimmed)
        if (heading) {
          const Tag = heading[1].length === 2 ? 'h2' : 'h3'
          return (
            <Tag key={key} className={cn('pt-2 font-semibold', Tag === 'h2' ? 'text-base' : 'text-[15px]')}>
              {renderInline(heading[2], key, renderText)}
            </Tag>
          )
        }

        const lines = trimmed.split('\n')
        const isList = lines.every(l => /^([-*]|\d+\.) /.test(l))
        if (isList) {
          const ordered = /^\d+\. /.test(lines[0])
          const Tag = ordered ? 'ol' : 'ul'
          return (
            <Tag key={key} className={cn('space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}>
              {lines.map((l, j) => (
                <li key={j} className="pl-1 marker:text-subtle">
                  {renderInline(l.replace(/^([-*]|\d+\.) /, ''), `${key}-${j}`, renderText)}
                </li>
              ))}
            </Tag>
          )
        }

        return <p key={key}>{renderInline(trimmed.replace(/\n/g, ' '), key, renderText)}</p>
      })}
    </div>
  )
}

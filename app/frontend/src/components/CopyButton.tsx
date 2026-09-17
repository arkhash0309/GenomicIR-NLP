import { useState } from 'react'

interface Props {
  text: string
  label?: string
  className?: string
}

export default function CopyButton({ text, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied!' : `${label}: ${text}`}
      title={copied ? 'Copied!' : label}
      className={`transition-colors text-xs ${className}`}
    >
      {copied ? (
        <span className="text-genomic-emerald">✓ Copied</span>
      ) : (
        <span>⧉</span>
      )}
    </button>
  )
}

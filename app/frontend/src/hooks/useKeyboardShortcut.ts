import { useEffect } from 'react'

type ShortcutMap = Record<string, () => void>

export function useKeyboardShortcut(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isTyping = active instanceof HTMLInputElement
        || active instanceof HTMLTextAreaElement
        || (active instanceof HTMLElement && active.isContentEditable)

      const key = [
        e.ctrlKey || e.metaKey ? 'ctrl' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key,
      ].filter(Boolean).join('+')

      if (key in shortcuts) {
        if (isTyping && !e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        shortcuts[key]()
      } else if (!isTyping && e.key in shortcuts) {
        e.preventDefault()
        shortcuts[e.key]()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

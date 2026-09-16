// src/hooks/useSSE.ts
import { useCallback, useRef } from 'react'

export interface SSEEvent {
  type: 'tool_call' | 'tool_result' | 'reasoning' | 'graph_update' | 'done'
  [key: string]: unknown
}

export function useSSE() {
  const abortRef = useRef<AbortController | null>(null)

  const stream = useCallback(async (
    url: string,
    body: object,
    onEvent: (e: SSEEvent) => void,
    onError?: (e: Error) => void
  ) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const reader = resp.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { onEvent(JSON.parse(line.slice(6))) } catch { /* ignore malformed SSE lines */ }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') onError?.(e as Error)
    }
  }, [])

  const cancel = useCallback(() => abortRef.current?.abort(), [])
  return { stream, cancel }
}

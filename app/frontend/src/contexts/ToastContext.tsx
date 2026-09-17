import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastKind = 'error' | 'success' | 'info'

interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
  error: (message: string) => void
  success: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  error: () => {},
  success: () => {},
})

const KIND_STYLE: Record<ToastKind, string> = {
  error:   'border-red-500/60 bg-red-500/10 text-red-300',
  success: 'border-genomic-emerald/60 bg-genomic-emerald/10 text-emerald-300',
  info:    'border-genomic-cyan/60 bg-genomic-cyan/10 text-genomic-cyan',
}

const KIND_ICON: Record<ToastKind, string> = {
  error: '✕',
  success: '✓',
  info: 'ℹ',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`glass rounded-xl px-4 py-3 border flex items-start gap-3 min-w-72 max-w-sm shadow-lg ${KIND_STYLE[toast.kind]}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span className="text-sm font-bold mt-0.5 shrink-0" aria-hidden="true">
        {KIND_ICON[toast.kind]}
      </span>
      <span className="text-sm leading-snug flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-sm leading-none"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </motion.div>
  )
}

let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = `toast-${seq++}`
    setToasts(prev => [...prev.slice(-4), { id, kind, message }])
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 4000)
  }, [dismiss])

  const error   = useCallback((msg: string) => toast(msg, 'error'), [toast])
  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])

  return (
    <ToastContext.Provider value={{ toast, error, success }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

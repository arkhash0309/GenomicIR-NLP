import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CircleCheck, CircleX, Info, X } from 'lucide-react'

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

const KIND_ICON: Record<ToastKind, ReactNode> = {
  error:   <CircleX size={16} className="text-danger" aria-hidden="true" />,
  success: <CircleCheck size={16} className="text-success" aria-hidden="true" />,
  info:    <Info size={16} className="text-accent" aria-hidden="true" />,
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="card flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 px-4 py-3 shadow-lg"
      role={toast.kind === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">{KIND_ICON[toast.kind]}</span>
      <span className="flex-1 text-sm leading-snug text-fg">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-subtle hover:text-fg"
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden="true" />
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
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2" aria-label="Notifications">
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

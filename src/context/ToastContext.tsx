'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { Toast, type ToastProps } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (type: ToastProps['type'], message: string, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastProps['type'], message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, type, message, duration, onClose: removeToast }])
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

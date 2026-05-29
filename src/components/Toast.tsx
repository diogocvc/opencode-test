import { useEffect } from 'react'
import { useStore } from '../store'

const ICONS = {
  error: (
    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const BG_COLORS = {
  error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
  success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
}

function ToastItem({ id, message, type }: { id: string; message: string; type: 'error' | 'success' | 'info' }) {
  const removeToast = useStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 5000)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 shadow-lg transition-all ${BG_COLORS[type]}`}
    >
      {ICONS[type]}
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{message}</p>
      <button onClick={() => removeToast(id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function Toast() {
  const toasts = useStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  )
}

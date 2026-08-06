import { useEffect } from 'react'
import { ToastProps } from './Toast.types'
import { Check, X } from 'lucide-react'

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [visible, onClose])

  return (
    <div
      className={`fixed left-1/2 top-6 z-[1300] flex -translate-x-1/2 items-center gap-sm rounded-lg border border-border bg-surface px-lg py-md shadow-modal transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
      }`}
    >
      <Check className="size-5 shrink-0 text-accent-positive" strokeWidth={1.6} absoluteStrokeWidth />
      <span className="whitespace-nowrap text-body text-text-primary">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-sm flex size-5 items-center justify-center text-text-icon hover:text-text-primary"
      >
        <X className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
    </div>
  )
}

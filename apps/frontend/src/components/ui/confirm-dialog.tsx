'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={event => event.target === event.currentTarget && onCancel()}
    >
      <div role="dialog" aria-modal="true" className="dashboard-card w-full max-w-md bg-white/95 p-6 animate-fade-in-scale">
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50">
            Отмена
          </button>
          <button type="button" onClick={onConfirm} className={`flex-1 rounded-xl px-4 py-2.5 font-semibold text-white transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-dark))]'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

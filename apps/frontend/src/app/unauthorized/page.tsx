import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="dashboard-page flex min-h-screen items-center justify-center px-4">
      <div className="dashboard-card w-full max-w-md p-8 text-center animate-fade-in-scale">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100/80 shadow-soft">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-slate-950">Доступ запрещён</h1>
        <p className="mb-8 text-slate-600">У вас нет прав для просмотра этой страницы.</p>
        <div className="flex flex-col gap-3">
          <Link href="/" className="dashboard-interactive rounded-xl bg-[hsl(var(--primary))] px-6 py-3 font-semibold text-white shadow-soft-md hover:-translate-y-0.5 hover:bg-[hsl(var(--primary-dark))]">
            На главную
          </Link>
          <Link href="/auth/login" className="dashboard-interactive rounded-xl border border-white/70 bg-white/60 px-6 py-3 text-slate-700 hover:bg-white/85">
            Войти с другим аккаунтом
          </Link>
        </div>
      </div>
    </div>
  )
}

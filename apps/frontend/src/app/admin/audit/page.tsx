'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

type AuditLog = {
  id: string
  action: string
  entity: string
  createdAt: string
  user?: { firstName: string; lastName: string; email: string }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  useEffect(() => {
    apiClient.get<{ logs: AuditLog[] }>('/audit').then(response => setLogs(response.data?.logs || [])).catch(() => setLogs([]))
  }, [])
  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lavender-700">Безопасность</p>
          <h1 className="text-3xl font-bold text-slate-950">Журнал действий</h1>
          <p className="mt-2 text-sm text-slate-500">Последние административные изменения в системе.</p>
        </div>
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {logs.map(log => (
              <div key={log.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="font-medium text-slate-900">{log.action} · {log.entity}</div><div className="text-sm text-slate-500">{log.user ? `${log.user.lastName} ${log.user.firstName}` : 'Система'}</div></div>
                <time className="text-sm text-slate-400">{new Date(log.createdAt).toLocaleString('ru-RU')}</time>
              </div>
            ))}
            {!logs.length && <div className="px-5 py-10 text-center text-slate-500">Записей пока нет</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Notification {
  id: string
  text: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    apiClient.get('/notifications').then(response => setNotifications(response.data?.notifications || []))
  }, [])

  const markRead = async (notification: Notification) => {
    if (notification.isRead) return
    await apiClient.patch(`/notifications/${notification.id}/read`)
    setNotifications(items => items.map(item => item.id === notification.id ? { ...item, isRead: true } : item))
  }

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <Badge variant="secondary" className="mb-3">Центр событий</Badge>
        <h1 className="mb-2 text-3xl font-bold text-slate-950">Уведомления</h1>
        <p className="mb-8 text-slate-600">Здесь появится сообщение после проверки вашей работы.</p>
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card key={notification.id} className={`p-5 ${notification.isRead ? 'opacity-70' : 'border-l-4 border-l-lavender-500'}`} onClick={() => void markRead(notification)}>
              <p className="text-sm text-slate-800">{notification.text}</p>
              <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString('ru-RU')}</p>
            </Card>
          ))}
          {notifications.length === 0 && <Card className="p-10 text-center text-slate-500">Новых уведомлений пока нет.</Card>}
        </div>
      </div>
    </div>
  )
}

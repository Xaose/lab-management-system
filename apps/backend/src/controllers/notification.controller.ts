import { Request, Response } from 'express'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    }),
    prisma.notification.count({ where: { userId, isRead: false } })
  ])

  res.json({ success: true, data: { notifications, unreadCount } })
})

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user?.userId }
  })
  if (!notification) throw new AppError(404, 'Notification not found')

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true }
  })
  res.json({ success: true })
})

import { Request, Response } from 'express'
import prisma from '@lab/database'
import { asyncHandler } from '../middleware/error.middleware'

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  })
  res.json({ success: true, data: { logs } })
})

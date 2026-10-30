import prisma from '@lab/database'
import type { Prisma } from '@lab/database'

export const recordAudit = async (input: {
  userId: string
  action: string
  entity: string
  entityId?: string
  details?: Prisma.InputJsonObject
}) => {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details
    }
  })
}

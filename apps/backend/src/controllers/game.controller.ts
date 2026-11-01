import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

const resultSchema = z.object({
  crystals: z.number().int().min(0).max(10),
  durationMs: z.number().int().min(1000).max(30000)
})

const getLeaderboardWhere = async (req: Request) => {
  const role = req.user?.role

  if (role === 'ADMIN') return {}
  if (role === 'TEACHER') return { user: { role: 'TEACHER' as const } }

  const student = await prisma.student.findUnique({
    where: { userId: req.user?.userId },
    select: { groupId: true }
  })
  if (!student) throw new AppError(404, 'Student profile not found')
  if (!student.groupId) return { userId: req.user?.userId }

  return {
    user: {
      role: 'STUDENT' as const,
      student: { groupId: student.groupId }
    }
  }
}

export const submitGameResult = asyncHandler(async (req: Request, res: Response) => {
  const { crystals, durationMs } = resultSchema.parse(req.body)
  const score = Math.min(1200, crystals * 100 + Math.max(0, 30 - Math.round(durationMs / 1000)) * 2)

  const result = await prisma.gameScore.create({
    data: {
      userId: req.user!.userId,
      crystals,
      durationMs,
      score
    }
  })

  res.status(201).json({
    success: true,
    data: { id: result.id, score: result.score }
  })
})

export const getGameLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const where = await getLeaderboardWhere(req)
  const scores = await prisma.gameScore.findMany({
    where,
    orderBy: [{ score: 'desc' }, { playedAt: 'asc' }],
    take: 50,
    distinct: ['userId'],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          student: { select: { group: { select: { name: true } } } }
        }
      }
    }
  })

  res.json({
    success: true,
    data: scores.map((item, index) => ({
      rank: index + 1,
      userId: item.user.id,
      name: `${item.user.firstName} ${item.user.lastName}`.trim(),
      role: item.user.role,
      group: item.user.student?.group?.name ?? null,
      score: item.score,
      crystals: item.crystals,
      playedAt: item.playedAt
    }))
  })
})

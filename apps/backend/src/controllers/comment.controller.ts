import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

const commentSchema = z.object({ text: z.string().trim().min(1).max(5000) })

async function getCommentContext(submissionId: string, userId: string, role: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, labWork: { include: { discipline: { include: { teachers: true } } } } }
  })
  if (!submission) throw new AppError(404, 'Submission not found')
  if (role === 'ADMIN') return submission
  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    if (student?.id !== submission.studentId) throw new AppError(403, 'Access denied')
  } else {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    if (!teacher || (submission.labWork.discipline.createdById !== teacher.id && !submission.labWork.discipline.teachers.some(item => item.teacherId === teacher.id))) {
      throw new AppError(403, 'Access denied')
    }
  }
  return submission
}

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  await getCommentContext(req.params.submissionId, req.user!.userId, req.user!.role)
  const comments = await prisma.comment.findMany({
    where: { submissionId: req.params.submissionId, isVisible: true },
    include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: 'asc' }
  })
  res.json({ success: true, data: { comments } })
})

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  await getCommentContext(req.params.submissionId, req.user!.userId, req.user!.role)
  const { text } = commentSchema.parse(req.body)
  const comment = await prisma.comment.create({
    data: { text, submissionId: req.params.submissionId, authorId: req.user!.userId },
    include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } }
  })
  res.status(201).json({ success: true, data: { comment } })
})

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
  if (!comment) throw new AppError(404, 'Comment not found')
  if (comment.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') throw new AppError(403, 'Access denied')
  await prisma.comment.delete({ where: { id: comment.id } })
  res.json({ success: true, message: 'Comment deleted successfully' })
})

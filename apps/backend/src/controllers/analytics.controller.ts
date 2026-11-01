import { Request, Response } from 'express'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

export const getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user?.userId },
    include: { group: { include: { disciplines: true } } }
  })
  if (!student) throw new AppError(404, 'Student profile not found')
  if (!student.group) throw new AppError(400, 'Student is not assigned to a group')

  const disciplineIds = student.group.disciplines.map(item => item.disciplineId)
  const [labWorks, submissions] = await Promise.all([
    prisma.labWork.findMany({
      where: { disciplineId: { in: disciplineIds }, status: 'PUBLISHED' },
      include: { discipline: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: 'asc' }, { number: 'asc' }]
    }),
    prisma.submission.findMany({
      where: { studentId: student.id },
      include: { reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const latestByLab = new Map<string, typeof submissions[number]>()
  for (const submission of submissions) {
    if (!latestByLab.has(submission.labWorkId)) latestByLab.set(submission.labWorkId, submission)
  }
  const completed = labWorks.filter(lab => latestByLab.get(lab.id)?.status === 'REVIEWED').length
  const pending = labWorks.filter(lab => {
    const status = latestByLab.get(lab.id)?.status
    return status === 'SUBMITTED' || status === 'IN_REVIEW'
  }).length
  const overdue = labWorks.filter(lab => lab.dueDate && lab.dueDate < new Date() && latestByLab.get(lab.id)?.status !== 'REVIEWED').length
  const scores = submissions.flatMap(item => item.reviews[0]?.score ?? [])

  res.json({
    success: true,
    data: {
      total: labWorks.length,
      completed,
      pending,
      overdue,
      averageScore: scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : null,
      completionPercent: labWorks.length ? Math.round((completed / labWorks.length) * 100) : 0,
      upcoming: labWorks.filter(lab => lab.dueDate && lab.dueDate >= new Date()).slice(0, 5).map(lab => ({
        id: lab.id, title: lab.title, dueDate: lab.dueDate, discipline: lab.discipline.name,
        status: latestByLab.get(lab.id)?.status || 'NOT_STARTED'
      }))
    }
  })
})

export const getTeacherAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user?.userId },
    include: { disciplinesCreated: true, disciplinesTeaching: true }
  })
  if (!teacher) throw new AppError(404, 'Teacher profile not found')
  const disciplineIds = [
    ...teacher.disciplinesCreated.map(item => item.id),
    ...teacher.disciplinesTeaching.map(item => item.disciplineId)
  ]
  const submissions = await prisma.submission.findMany({
    where: { labWork: { disciplineId: { in: disciplineIds } } },
    include: { reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 }, labWork: { select: { title: true } } }
  })
  const scores = submissions.flatMap(item => item.reviews[0]?.score ?? [])
  const reviewed = submissions.filter(item => item.status === 'REVIEWED').length
  res.json({
    success: true,
    data: {
      disciplines: disciplineIds.length,
      submissions: submissions.length,
      pending: submissions.filter(item => item.status === 'SUBMITTED' || item.status === 'IN_REVIEW').length,
      reviewed,
      revision: submissions.filter(item => item.status === 'REVISION').length,
      averageScore: scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : null,
      reviewRate: submissions.length ? Math.round((reviewed / submissions.length) * 100) : 0
    }
  })
})

export const exportTeacherGradebook = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user?.userId },
    include: { disciplinesCreated: true, disciplinesTeaching: true }
  })
  if (!teacher) throw new AppError(404, 'Teacher profile not found')
  const disciplineIds = [
    ...teacher.disciplinesCreated.map(item => item.id),
    ...teacher.disciplinesTeaching.map(item => item.disciplineId)
  ]
  const submissions = await prisma.submission.findMany({
    where: { labWork: { disciplineId: { in: disciplineIds } } },
    include: {
      student: { include: { user: true, group: true } },
      labWork: { include: { discipline: true } },
      reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 }
    },
    orderBy: { student: { user: { lastName: 'asc' } } }
  })
  const escape = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const rows = [
    ['Студент', 'Группа', 'Дисциплина', 'Лабораторная', 'Попытка', 'Статус', 'Оценка', 'Дата сдачи'],
    ...submissions.map(item => [
      `${item.student.user.lastName} ${item.student.user.firstName}`,
      item.student.group?.name ?? 'Без группы',
      item.labWork.discipline.name,
      `ЛР №${item.labWork.number}: ${item.labWork.title}`,
      item.attemptNumber,
      item.status,
      item.reviews[0]?.score ?? '',
      item.submittedAt?.toISOString() ?? ''
    ])
  ]
  const csv = '\ufeff' + rows.map(row => row.map(escape).join(';')).join('\r\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="vedomost.csv"')
  res.send(csv)
})

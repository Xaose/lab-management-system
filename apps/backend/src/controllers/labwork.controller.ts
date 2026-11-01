import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'
import { recordAudit } from '../services/audit.service'
import { labWorkSlug } from '../utils/slug'

async function resolveLabWorkId(value: string): Promise<string | null> {
  const byId = await prisma.labWork.findUnique({ where: { id: value }, select: { id: true } })
  if (byId) return byId.id
  const labWorks = await prisma.labWork.findMany({ select: { id: true, number: true, title: true } })
  return labWorks.find(labWork => labWorkSlug(labWork.number, labWork.title) === value)?.id || null
}

// Validation schemas
const createLabWorkSchema = z.object({
  disciplineId: z.string(),
  number: z.number().int().positive(),
  section: z.string().trim().max(120).nullable().optional(),
  title: z.string().min(1),
  description: z.string(),
  requirements: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  maxScore: z.number().int().positive(),
  allowResubmit: z.boolean().default(true),
  maxAttempts: z.number().int().positive().nullable().optional(),
  allowedFormats: z.array(z.string()).default(['pdf', 'docx', 'zip']),
  maxFileSize: z.number().int().positive().default(10485760), // 10MB
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED']).default('DRAFT')
})

const updateLabWorkSchema = createLabWorkSchema.partial()

const createCriterionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxScore: z.number().int().positive(),
  order: z.number().int().default(0)
})

const assertLabWorkEditor = async (
  labWork: {
    discipline: {
      createdById: string
      teachers: Array<{ teacherId: string }>
    }
  },
  userRole: string | undefined,
  userId: string | undefined
) => {
  if (userRole === 'ADMIN') return

  const teacher = userId
    ? await prisma.teacher.findUnique({ where: { userId } })
    : null
  const hasAccess = Boolean(
    teacher &&
    (labWork.discipline.createdById === teacher.id ||
      labWork.discipline.teachers.some(assignment => assignment.teacherId === teacher.id))
  )

  if (!hasAccess) {
    throw new AppError(403, 'Access denied')
  }
}

// Get all lab works (with filters)
export const getLabWorks = asyncHandler(async (req: Request, res: Response) => {
  const { disciplineId, status } = req.query
  const userRole = req.user?.role
  const userId = req.user?.userId

  const where: any = {}

  // Фильтр по дисциплине
  if (disciplineId) {
    where.disciplineId = disciplineId as string
  }

  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    if (!teacher) {
      throw new AppError(404, 'Teacher profile not found')
    }
    where.discipline = {
      OR: [
        { createdById: teacher.id },
        { teachers: { some: { teacherId: teacher.id } } }
      ]
    }
  }

  // Фильтр по статусу
  if (status && userRole !== 'STUDENT') {
    where.status = status
  } else if (userRole === 'STUDENT') {
    // Студенты видят только опубликованные работы
    where.status = 'PUBLISHED'
  }

  // Для студентов — только работы по их дисциплинам
  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        group: {
          include: {
            disciplines: {
              include: { discipline: true }
            }
          }
        }
      }
    })

    if (!student) {
      throw new AppError(404, 'Student profile not found')
    }
    if (!student.group) {
      throw new AppError(403, 'Student is not assigned to a group')
    }

    const disciplineIds = student.group.disciplines.map(d => d.disciplineId)
    if (disciplineId) {
      if (!disciplineIds.includes(disciplineId as string)) {
        throw new AppError(403, 'Access denied')
      }
      where.disciplineId = disciplineId as string
    } else {
      where.disciplineId = { in: disciplineIds }
    }
  }

  const labWorks = await prisma.labWork.findMany({
    where,
    include: {
      discipline: {
        select: {
          id: true,
          name: true
        }
      },
      criteria: true,
      _count: {
        select: {
          submissions: true
        }
      }
    },
    orderBy: [
      { discipline: { name: 'asc' } },
      { number: 'asc' }
    ]
  })

  res.json({
    success: true,
    data: { labWorks }
  })
})

// Get single lab work
export const getLabWork = asyncHandler(async (req: Request, res: Response) => {
  const labWorkId = await resolveLabWorkId(req.params.id)
  if (!labWorkId) throw new AppError(404, 'Lab work not found')
  const userRole = req.user?.role
  const userId = req.user?.userId

  const labWork = await prisma.labWork.findUnique({
    where: { id: labWorkId },
    include: {
      discipline: {
        select: {
          id: true,
          name: true,
          createdById: true
        }
      },
      criteria: {
        orderBy: { order: 'asc' }
      },
      files: true,
      _count: {
        select: {
          submissions: true
        }
      }
    }
  })

  if (!labWork) {
    throw new AppError(404, 'Lab work not found')
  }

  // Проверка доступа для студентов
  if (userRole === 'STUDENT') {
    if (labWork.status !== 'PUBLISHED') {
      throw new AppError(403, 'Access denied')
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        group: {
          include: {
            disciplines: true
          }
        }
      }
    })

    const hasAccess = student?.group?.disciplines.some(
      d => d.disciplineId === labWork.disciplineId
    )

    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    const hasAccess = Boolean(
      teacher &&
      (labWork.discipline.createdById === teacher.id ||
        await prisma.disciplineTeacher.findUnique({
          where: {
            disciplineId_teacherId: {
              disciplineId: labWork.disciplineId,
              teacherId: teacher.id
            }
          }
        }))
    )
    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  res.json({
    success: true,
    data: { labWork }
  })
})

// Create lab work (TEACHER, ADMIN)
export const createLabWork = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createLabWorkSchema.parse(req.body)
  const userRole = req.user?.role
  const userId = req.user?.userId

  // Проверка прав
  const discipline = await prisma.discipline.findUnique({
    where: { id: validatedData.disciplineId },
    include: {
      teachers: true
    }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    })

    const hasAccess = discipline.createdById === teacher?.id ||
      discipline.teachers.some(t => t.teacherId === teacher?.id)

    if (!hasAccess) {
      throw new AppError(403, 'You can only create lab works for your disciplines')
    }
  }

  // Проверка уникальности номера
  const existing = await prisma.labWork.findUnique({
    where: {
      disciplineId_number: {
        disciplineId: validatedData.disciplineId,
        number: validatedData.number
      }
    }
  })

  if (existing) {
    throw new AppError(400, 'Lab work with this number already exists in this discipline')
  }

  if (validatedData.status === 'PUBLISHED') {
    throw new AppError(400, 'Publish the lab work after attaching the assignment file')
  }
  if (validatedData.dueDate && new Date(validatedData.dueDate) <= new Date()) {
    throw new AppError(400, 'Due date must be in the future')
  }

  const labWork = await prisma.labWork.create({
    data: {
      ...validatedData,
      publishedAt: null
    },
    include: {
      discipline: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  await prisma.criterion.createMany({
    data: [
      { labWorkId: labWork.id, name: 'Корректность решения', description: 'Работа выполняет поставленную задачу.', maxScore: 30, order: 1 },
      { labWorkId: labWork.id, name: 'Полнота отчёта', description: 'Присутствуют все обязательные разделы и результаты.', maxScore: 30, order: 2 },
      { labWorkId: labWork.id, name: 'Оформление', description: 'Отчёт оформлен аккуратно и последовательно.', maxScore: 20, order: 3 },
      { labWorkId: labWork.id, name: 'Защита работы', description: 'Студент может объяснить решение и ответить на вопросы.', maxScore: 20, order: 4 }
    ]
  })
  await recordAudit({
    userId: userId!,
    action: 'CREATE_LAB_WORK',
    entity: 'LabWork',
    entityId: labWork.id,
    details: { disciplineId: labWork.discipline.id, number: labWork.number }
  })

  res.status(201).json({
    success: true,
    data: { labWork },
    message: 'Lab work created successfully'
  })
})

// Update lab work
export const updateLabWork = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = updateLabWorkSchema.parse(req.body)
  const userRole = req.user?.role
  const userId = req.user?.userId

  const labWork = await prisma.labWork.findUnique({
    where: { id },
    include: {
      discipline: {
        include: {
          teachers: true
        }
      },
      files: true
    }
  })

  if (!labWork) {
    throw new AppError(404, 'Lab work not found')
  }

  // Проверка прав
  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    })

    const hasAccess = labWork.discipline.createdById === teacher?.id ||
      labWork.discipline.teachers.some(t => t.teacherId === teacher?.id)

    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }

  }

  const targetStatus = validatedData.status ?? labWork.status
  const targetDueDate = validatedData.dueDate === undefined
    ? labWork.dueDate
    : validatedData.dueDate
      ? new Date(validatedData.dueDate)
      : null
  if (targetStatus === 'PUBLISHED' && labWork.files.length === 0) {
    throw new AppError(400, 'Attach an assignment file before publishing')
  }
  if (targetDueDate && targetDueDate <= new Date()) {
    throw new AppError(400, 'Due date must be in the future')
  }

  // Обновление publishedAt при публикации
  const updateData: any = { ...validatedData }
  if (validatedData.status === 'PUBLISHED' && labWork.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date()
  }

  const updated = await prisma.labWork.update({
    where: { id },
    data: updateData,
    include: {
      discipline: {
        select: {
          id: true,
          name: true
        }
      },
      criteria: true
    }
  })
  await recordAudit({
    userId: userId!,
    action: 'UPDATE_LAB_WORK',
    entity: 'LabWork',
    entityId: updated.id,
    details: { status: updated.status }
  })

  res.json({
    success: true,
    data: { labWork: updated },
    message: 'Lab work updated successfully'
  })
})

// Delete lab work
export const deleteLabWork = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userRole = req.user?.role
  const userId = req.user?.userId

  const labWork = await prisma.labWork.findUnique({
    where: { id },
    include: {
      discipline: {
        include: {
          teachers: true
        }
      },
      _count: {
        select: {
          submissions: true
        }
      }
    }
  })

  if (!labWork) {
    throw new AppError(404, 'Lab work not found')
  }

  // Проверка прав
  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    })

    const hasAccess = labWork.discipline.createdById === teacher?.id ||
      labWork.discipline.teachers.some(t => t.teacherId === teacher?.id)

    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  // Нельзя удалить работу с существующими сдачами
  if (labWork._count.submissions > 0) {
    throw new AppError(400, 'Cannot delete lab work with existing submissions. Archive it instead.')
  }

  await prisma.labWork.delete({
    where: { id }
  })
  await recordAudit({
    userId: userId!,
    action: 'DELETE_LAB_WORK',
    entity: 'LabWork',
    entityId: id
  })

  res.json({
    success: true,
    message: 'Lab work deleted successfully'
  })
})

// Add criterion to lab work
export const addCriterion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = createCriterionSchema.parse(req.body)
  const userId = req.user?.userId

  const labWork = await prisma.labWork.findUnique({
    where: { id },
    include: { discipline: { include: { teachers: true } } }
  })

  if (!labWork) {
    throw new AppError(404, 'Lab work not found')
  }

  await assertLabWorkEditor(labWork, req.user?.role, userId)

  const criterion = await prisma.criterion.create({
    data: {
      ...validatedData,
      labWorkId: id
    }
  })

  res.status(201).json({
    success: true,
    data: { criterion },
    message: 'Criterion added successfully'
  })
})

// Update criterion
export const updateCriterion = asyncHandler(async (req: Request, res: Response) => {
  const { criterionId } = req.params
  const validatedData = createCriterionSchema.partial().parse(req.body)
  const userId = req.user?.userId

  const existingCriterion = await prisma.criterion.findUnique({
    where: { id: criterionId },
    include: { labWork: { include: { discipline: { include: { teachers: true } } } } }
  })
  if (!existingCriterion) {
    throw new AppError(404, 'Criterion not found')
  }
  await assertLabWorkEditor(existingCriterion.labWork, req.user?.role, userId)

  const criterion = await prisma.criterion.update({
    where: { id: criterionId },
    data: validatedData
  })

  res.json({
    success: true,
    data: { criterion },
    message: 'Criterion updated successfully'
  })
})

// Delete criterion
export const deleteCriterion = asyncHandler(async (req: Request, res: Response) => {
  const { criterionId } = req.params
  const userId = req.user?.userId

  const existingCriterion = await prisma.criterion.findUnique({
    where: { id: criterionId },
    include: { labWork: { include: { discipline: { include: { teachers: true } } } } }
  })
  if (!existingCriterion) {
    throw new AppError(404, 'Criterion not found')
  }
  await assertLabWorkEditor(existingCriterion.labWork, req.user?.role, userId)
  await prisma.criterion.delete({
    where: { id: criterionId }
  })

  res.json({
    success: true,
    message: 'Criterion deleted successfully'
  })
})

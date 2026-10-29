import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { ApiResponse } from '@lab/types'
import { AppError, asyncHandler } from '../middleware/error.middleware'

// Validation schemas
const createDisciplineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  semester: z.number().int().min(1),
  year: z.number().int(),
  hours: z.number().int().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
})

const updateDisciplineSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  semester: z.number().int().min(1).optional(),
  year: z.number().int().optional(),
  hours: z.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
})

const assignTeachersSchema = z.object({
  teacherIds: z.array(z.string()).min(1)
})

const assignGroupsSchema = z.object({
  groups: z.array(
    z.object({
      groupId: z.string(),
      semester: z.number().int().min(1),
      year: z.number().int()
    })
  ).min(1)
})

// GET /api/disciplines - список дисциплин с фильтрацией
export const getDisciplines = asyncHandler(async (req: Request, res: Response) => {
  const { status, year, semester, search, page = '1', limit = '20' } = req.query
  const userRole = req.user?.role
  const userId = req.user?.userId

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}

  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    if (!student) {
      throw new AppError(404, 'Student profile not found')
    }
    where.groups = { some: { groupId: student.groupId } }
    where.status = 'PUBLISHED'
  } else if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    if (!teacher) {
      throw new AppError(404, 'Teacher profile not found')
    }
    where.AND = [{
      OR: [
        { createdById: teacher.id },
        { teachers: { some: { teacherId: teacher.id } } }
      ]
    }]
  }

  if (status && typeof status === 'string' && userRole !== 'STUDENT') {
    where.status = status
  }

  if (year) {
    where.year = parseInt(year as string)
  }

  if (semester) {
    where.semester = parseInt(semester as string)
  }

  if (search && typeof search === 'string') {
    const searchCondition = {
      OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    where.AND = [...(where.AND || []), searchCondition]
  }

  const [disciplines, total] = await Promise.all([
    prisma.discipline.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            teachers: true,
            groups: true,
            labWorks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.discipline.count({ where })
  ])

  const response: ApiResponse = {
    success: true,
    data: {
      disciplines,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  }

  res.json(response)
})

// GET /api/disciplines/:id - получить дисциплину по ID
export const getDisciplineById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const discipline = await prisma.discipline.findUnique({
    where: { id },
    include: {
      createdBy: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patronymic: true,
              email: true
            }
          }
        }
      },
      teachers: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  patronymic: true,
                  email: true
                }
              }
            }
          }
        }
      },
      groups: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              course: true,
              program: true,
              faculty: true,
              _count: {
                select: {
                  students: true
                }
              }
            }
          }
        }
      },
      labWorks: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          maxScore: true,
          dueDate: true,
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          number: 'asc'
        }
      },
      _count: {
        select: {
          teachers: true,
          groups: true,
          labWorks: true
        }
      }
    }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  if (req.user?.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId }
    })
    const hasAccess = Boolean(
      student &&
      discipline.status === 'PUBLISHED' &&
      discipline.groups.some(assignment => assignment.groupId === student.groupId)
    )
    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  if (req.user?.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId }
    })
    const hasAccess = Boolean(
      teacher &&
      (discipline.createdById === teacher.id ||
        discipline.teachers.some(assignment => assignment.teacherId === teacher.id))
    )
    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  const response: ApiResponse = {
    success: true,
    data: { discipline }
  }

  res.json(response)
})

// POST /api/disciplines - создать дисциплину
export const createDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createDisciplineSchema.parse(req.body)
  const userId = req.user?.userId

  if (!userId) {
    throw new AppError(401, 'Unauthorized')
  }

  // Проверка, что создающий пользователь является преподавателем или админом
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  // Если не админ, то должен быть преподаватель
  if (user.role !== 'ADMIN' && !user.teacher) {
    throw new AppError(403, 'Only teachers and admins can create disciplines')
  }

  let createdById: string

  if (user.role === 'ADMIN') {
    // Админ должен указать преподавателя-создателя или стать им
    // Для упрощения, админ не может создавать дисциплины напрямую
    throw new AppError(400, 'Admin must assign a teacher to create discipline')
  } else {
    createdById = user.teacher!.id
  }

  const discipline = await prisma.discipline.create({
    data: {
      ...validatedData,
      createdById
    },
    include: {
      createdBy: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: {
          teachers: true,
          groups: true,
          labWorks: true
        }
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { discipline },
    message: 'Discipline created successfully'
  }

  res.status(201).json(response)
})

// PUT /api/disciplines/:id - обновить дисциплину
export const updateDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = updateDisciplineSchema.parse(req.body)
  const userId = req.user?.userId

  // Проверка существования дисциплины
  const discipline = await prisma.discipline.findUnique({
    where: { id },
    include: {
      createdBy: {
        include: {
          user: true
        }
      }
    }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  // Проверка прав: админ или создатель
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  const isCreator = discipline.createdBy.userId === userId
  const isAdmin = user.role === 'ADMIN'

  if (!isCreator && !isAdmin) {
    throw new AppError(403, 'You do not have permission to update this discipline')
  }

  const updatedDiscipline = await prisma.discipline.update({
    where: { id },
    data: validatedData,
    include: {
      createdBy: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: {
          teachers: true,
          groups: true,
          labWorks: true
        }
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { discipline: updatedDiscipline },
    message: 'Discipline updated successfully'
  }

  res.json(response)
})

// DELETE /api/disciplines/:id - удалить дисциплину
export const deleteDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.userId

  const discipline = await prisma.discipline.findUnique({
    where: { id },
    include: {
      createdBy: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          labWorks: true
        }
      }
    }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  // Проверка прав: админ или создатель
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  const isCreator = discipline.createdBy.userId === userId
  const isAdmin = user.role === 'ADMIN'

  if (!isCreator && !isAdmin) {
    throw new AppError(403, 'You do not have permission to delete this discipline')
  }

  // Проверка, что нет лабораторных работ
  if (discipline._count.labWorks > 0) {
    throw new AppError(400, 'Cannot delete discipline with lab works. Please delete lab works first.')
  }

  await prisma.discipline.delete({
    where: { id }
  })

  const response: ApiResponse = {
    success: true,
    message: 'Discipline deleted successfully'
  }

  res.json(response)
})

// POST /api/disciplines/:id/teachers - назначить преподавателей на дисциплину
export const assignTeachersToDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { teacherIds } = assignTeachersSchema.parse(req.body)

  // Проверка существования дисциплины
  const discipline = await prisma.discipline.findUnique({
    where: { id }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  // Проверка, что все преподаватели существуют
  const teachers = await prisma.teacher.findMany({
    where: {
      id: {
        in: teacherIds
      }
    }
  })

  if (teachers.length !== teacherIds.length) {
    throw new AppError(400, 'Some teachers not found')
  }

  // Добавление преподавателей (игнорируем дубликаты)
  const createPromises = teacherIds.map((teacherId) =>
    prisma.disciplineTeacher.upsert({
      where: {
        disciplineId_teacherId: {
          disciplineId: id,
          teacherId
        }
      },
      create: {
        disciplineId: id,
        teacherId
      },
      update: {}
    })
  )

  await Promise.all(createPromises)

  const response: ApiResponse = {
    success: true,
    message: `${teacherIds.length} teacher(s) assigned to discipline successfully`
  }

  res.json(response)
})

// DELETE /api/disciplines/:disciplineId/teachers/:teacherId - удалить преподавателя с дисциплины
export const removeTeacherFromDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { disciplineId, teacherId } = req.params

  const assignment = await prisma.disciplineTeacher.findUnique({
    where: {
      disciplineId_teacherId: {
        disciplineId,
        teacherId
      }
    }
  })

  if (!assignment) {
    throw new AppError(404, 'Teacher assignment not found')
  }

  await prisma.disciplineTeacher.delete({
    where: {
      disciplineId_teacherId: {
        disciplineId,
        teacherId
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    message: 'Teacher removed from discipline successfully'
  }

  res.json(response)
})

// POST /api/disciplines/:id/groups - назначить группы на дисциплину
export const assignGroupsToDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { groups } = assignGroupsSchema.parse(req.body)

  // Проверка существования дисциплины
  const discipline = await prisma.discipline.findUnique({
    where: { id }
  })

  if (!discipline) {
    throw new AppError(404, 'Discipline not found')
  }

  // Проверка, что все группы существуют
  const groupIds = groups.map((g) => g.groupId)
  const foundGroups = await prisma.group.findMany({
    where: {
      id: {
        in: groupIds
      }
    }
  })

  if (foundGroups.length !== groupIds.length) {
    throw new AppError(400, 'Some groups not found')
  }

  // Добавление групп (игнорируем дубликаты)
  const createPromises = groups.map((group) =>
    prisma.disciplineGroup.upsert({
      where: {
        disciplineId_groupId: {
          disciplineId: id,
          groupId: group.groupId
        }
      },
      create: {
        disciplineId: id,
        groupId: group.groupId,
        semester: group.semester,
        year: group.year
      },
      update: {
        semester: group.semester,
        year: group.year
      }
    })
  )

  await Promise.all(createPromises)

  const response: ApiResponse = {
    success: true,
    message: `${groups.length} group(s) assigned to discipline successfully`
  }

  res.json(response)
})

// DELETE /api/disciplines/:disciplineId/groups/:groupId - удалить группу с дисциплины
export const removeGroupFromDiscipline = asyncHandler(async (req: Request, res: Response) => {
  const { disciplineId, groupId } = req.params

  const assignment = await prisma.disciplineGroup.findUnique({
    where: {
      disciplineId_groupId: {
        disciplineId,
        groupId
      }
    }
  })

  if (!assignment) {
    throw new AppError(404, 'Group assignment not found')
  }

  await prisma.disciplineGroup.delete({
    where: {
      disciplineId_groupId: {
        disciplineId,
        groupId
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    message: 'Group removed from discipline successfully'
  }

  res.json(response)
})

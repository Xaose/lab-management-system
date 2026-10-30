import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { ApiResponse } from '@lab/types'
import { AppError, asyncHandler } from '../middleware/error.middleware'
import { slugify } from '../utils/slug'

async function resolveGroupId(value: string): Promise<string | null> {
  const byId = await prisma.group.findUnique({ where: { id: value }, select: { id: true } })
  if (byId) return byId.id
  const groups = await prisma.group.findMany({ select: { id: true, name: true } })
  return groups.find(group => slugify(group.name) === value)?.id || null
}

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1),
  course: z.number().int().min(1).max(6),
  program: z.string().min(1),
  faculty: z.string().min(1),
  facultyId: z.string().optional(),
  year: z.number().int()
})

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  course: z.number().int().min(1).max(6).optional(),
  program: z.string().min(1).optional(),
  faculty: z.string().min(1).optional(),
  year: z.number().int().optional()
})

const assignStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1)
})

// GET /api/groups - список групп с фильтрацией
export const getGroups = asyncHandler(async (req: Request, res: Response) => {
  const { course, faculty, program, search, page = '1', limit = '20' } = req.query
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
    where.id = student.groupId
  } else if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { disciplinesTeaching: true, disciplinesCreated: true }
    })
    if (!teacher) {
      throw new AppError(404, 'Teacher profile not found')
    }
    const disciplineIds = [
      ...teacher.disciplinesTeaching.map(assignment => assignment.disciplineId),
      ...teacher.disciplinesCreated.map(discipline => discipline.id)
    ]
    where.disciplines = { some: { disciplineId: { in: disciplineIds } } }
  }

  if (course) {
    where.course = parseInt(course as string)
  }

  if (faculty && typeof faculty === 'string') {
    where.faculty = { contains: faculty, mode: 'insensitive' }
  }

  if (program && typeof program === 'string') {
    where.program = { contains: program, mode: 'insensitive' }
  }

  if (search && typeof search === 'string') {
    where.name = { contains: search, mode: 'insensitive' }
  }

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: {
            students: true,
            disciplines: true
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.group.count({ where })
  ])

  const response: ApiResponse = {
    success: true,
    data: {
      groups,
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

// GET /api/groups/:id - получить группу по ID
export const getGroupById = asyncHandler(async (req: Request, res: Response) => {
  const groupId = await resolveGroupId(req.params.id)
  if (!groupId) throw new AppError(404, 'Group not found')

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      students: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              patronymic: true,
              status: true
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      },
      disciplines: {
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              semester: true,
              year: true,
              status: true
            }
          }
        }
      },
      _count: {
        select: {
          students: true,
          disciplines: true
        }
      }
    }
  })

  if (!group) {
    throw new AppError(404, 'Group not found')
  }

  if (req.user?.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } })
    if (student?.groupId !== groupId) {
      throw new AppError(403, 'Access denied')
    }

  }

  if (req.user?.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
      include: { disciplinesCreated: true, disciplinesTeaching: true }
    })
    const disciplineIds = [
      ...(teacher?.disciplinesCreated || []).map(discipline => discipline.id),
      ...(teacher?.disciplinesTeaching || []).map(assignment => assignment.disciplineId)
    ]
    if (!group.disciplines.some(assignment => disciplineIds.includes(assignment.disciplineId))) {
      throw new AppError(403, 'Access denied')
    }
  }

  const response: ApiResponse = {
    success: true,
    data: { group }
  }

  res.json(response)
})

// POST /api/groups - создать группу
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createGroupSchema.parse(req.body)

  // Проверка уникальности названия группы
  const existingGroup = await prisma.group.findUnique({
    where: { name: validatedData.name }
  })

  if (existingGroup) {
    throw new AppError(400, 'Group with this name already exists')
  }

  const group = await prisma.group.create({
    data: validatedData,
    include: {
      _count: {
        select: {
          students: true,
          disciplines: true
        }
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { group },
    message: 'Group created successfully'
  }

  res.status(201).json(response)
})

// PUT /api/groups/:id - обновить группу
export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = updateGroupSchema.parse(req.body)

  // Проверка существования группы
  const existingGroup = await prisma.group.findUnique({
    where: { id }
  })

  if (!existingGroup) {
    throw new AppError(404, 'Group not found')
  }

  // Проверка уникальности названия при изменении
  if (validatedData.name && validatedData.name !== existingGroup.name) {
    const nameTaken = await prisma.group.findUnique({
      where: { name: validatedData.name }
    })

    if (nameTaken) {
      throw new AppError(400, 'Group name already in use')
    }
  }

  const group = await prisma.group.update({
    where: { id },
    data: validatedData,
    include: {
      _count: {
        select: {
          students: true,
          disciplines: true
        }
      }
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { group },
    message: 'Group updated successfully'
  }

  res.json(response)
})

// DELETE /api/groups/:id - удалить группу
export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true
        }
      }
    }
  })

  if (!group) {
    throw new AppError(404, 'Group not found')
  }

  // Проверка, что в группе нет студентов
  if (group._count.students > 0) {
    throw new AppError(400, 'Cannot delete group with students. Please reassign students first.')
  }

  await prisma.group.delete({
    where: { id }
  })

  const response: ApiResponse = {
    success: true,
    message: 'Group deleted successfully'
  }

  res.json(response)
})

// POST /api/groups/:id/students - назначить студентов в группу
export const assignStudentsToGroup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { studentIds } = assignStudentsSchema.parse(req.body)

  // Проверка существования группы
  const group = await prisma.group.findUnique({
    where: { id }
  })

  if (!group) {
    throw new AppError(404, 'Group not found')
  }

  // Проверка, что все студенты существуют
  const students = await prisma.student.findMany({
    where: {
      id: {
        in: studentIds
      }
    }
  })

  if (students.length !== studentIds.length) {
    throw new AppError(400, 'Some students not found')
  }

  // Обновление группы для всех студентов
  await prisma.student.updateMany({
    where: {
      id: {
        in: studentIds
      }
    },
    data: {
      groupId: id
    }
  })

  const response: ApiResponse = {
    success: true,
    message: `${studentIds.length} student(s) assigned to group successfully`
  }

  res.json(response)
})

// DELETE /api/groups/:groupId/students/:studentId - удалить студента из группы
export const removeStudentFromGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, studentId } = req.params

  const student = await prisma.student.findUnique({
    where: { id: studentId }
  })

  if (!student) {
    throw new AppError(404, 'Student not found')
  }

  if (student.groupId !== groupId) {
    throw new AppError(400, 'Student is not in this group')
  }

  // Примечание: в реальном приложении нужно решить, что делать с студентом без группы
  // Пока просто выдаем ошибку, что студент должен быть в какой-то группе
  throw new AppError(400, 'Cannot remove student from group. Please reassign to another group instead.')
})

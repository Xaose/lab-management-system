import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import prisma from '@lab/database'
import { ApiResponse } from '@lab/types'
import { AppError, asyncHandler } from '../middleware/error.middleware'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  patronymic: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  // Дополнительные поля для студентов
  studentData: z.object({
    studentIdNumber: z.string(),
    groupId: z.string(),
    course: z.number().int().min(1).max(6),
    program: z.string(),
    programId: z.string().optional(),
    faculty: z.string()
  }).optional(),
  // Дополнительные поля для преподавателей
  teacherData: z.object({
    position: z.string().optional(),
    department: z.string(),
    degree: z.string().optional(),
    title: z.string().optional()
  }).optional()
})

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  patronymic: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'BLOCKED', 'INACTIVE']).optional(),
  // Обновление данных студента
  studentData: z.object({
    studentIdNumber: z.string().optional(),
    groupId: z.string().optional(),
    course: z.number().int().min(1).max(6).optional(),
    program: z.string().optional(),
    faculty: z.string().optional()
  }).optional(),
  // Обновление данных преподавателя
  teacherData: z.object({
    position: z.string().optional(),
    department: z.string().optional(),
    degree: z.string().optional(),
    title: z.string().optional()
  }).optional()
})

// GET /api/users - список пользователей с фильтрацией
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, status, search, page = '1', limit = '20' } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}

  if (role && typeof role === 'string') {
    where.role = role
  }

  if (status && typeof status === 'string') {
    where.status = status
  }

  if (search && typeof search === 'string') {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        patronymic: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            course: true,
            program: true,
            faculty: true,
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        teacher: {
          select: {
            id: true,
            position: true,
            department: true,
            degree: true,
            title: true,
            disciplinesTeaching: {
              select: {
                discipline: {
                  select: { name: true }
                }
              }
            }
          }
        },
        admin: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  const response: ApiResponse = {
    success: true,
    data: {
      users,
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

// GET /api/users/:id - получить одного пользователя
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      patronymic: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          studentIdNumber: true,
          course: true,
          program: true,
          faculty: true,
          group: {
            select: {
              id: true,
              name: true,
              course: true,
              program: true,
              faculty: true
            }
          }
        }
      },
      teacher: {
        select: {
          id: true,
          position: true,
          department: true,
          degree: true,
          title: true,
          disciplinesTeaching: {
            select: {
              discipline: {
                select: { name: true }
              }
            }
          }
        }
      },
      admin: {
        select: {
          id: true
        }
      }
    }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  const response: ApiResponse = {
    success: true,
    data: { user }
  }

  res.json(response)
})

// POST /api/users - создать пользователя (для админа)
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createUserSchema.parse(req.body)
  const normalizedEmail = validatedData.email.trim().toLowerCase()

  // Проверка существующего пользователя
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
  })

  if (existingUser) {
    throw new AppError(400, 'User with this email already exists')
  }

  // Проверка уникальности номера зачетной книжки для студентов
  if (validatedData.role === 'STUDENT' && validatedData.studentData) {
    const existingStudent = await prisma.student.findUnique({
      where: { studentIdNumber: validatedData.studentData.studentIdNumber }
    })

    if (existingStudent) {
      throw new AppError(400, 'Student with this ID number already exists')
    }

    // Проверка существования группы
    const group = await prisma.group.findUnique({
      where: { id: validatedData.studentData.groupId }
    })

    if (!group) {
      throw new AppError(404, 'Group not found')
    }
  }

  // Хеширование пароля
  const passwordHash = await bcrypt.hash(validatedData.password, 10)

  // Создание пользователя с профилем
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      patronymic: validatedData.patronymic,
      phone: validatedData.phone,
      role: validatedData.role,
      ...(validatedData.role === 'STUDENT' && validatedData.studentData
        ? {
            student: {
              create: {
                studentIdNumber: validatedData.studentData.studentIdNumber,
                groupId: validatedData.studentData.groupId,
                course: validatedData.studentData.course,
                program: validatedData.studentData.program,
                programId: validatedData.studentData.programId,
                faculty: validatedData.studentData.faculty
              }
            }
          }
        : {}),
      ...(validatedData.role === 'TEACHER' && validatedData.teacherData
        ? {
            teacher: {
              create: {
                position: validatedData.teacherData.position || null,
                department: validatedData.teacherData.department,
                degree: validatedData.teacherData.degree,
                title: validatedData.teacherData.title
              }
            }
          }
        : {}),
      ...(validatedData.role === 'ADMIN'
        ? {
            admin: {
              create: {}
            }
          }
        : {})
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      patronymic: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      student: true,
      teacher: true,
      admin: true
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { user },
    message: 'User created successfully'
  }

  res.status(201).json(response)
})

// PUT /api/users/:id - обновить пользователя
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = updateUserSchema.parse(req.body)

  // Проверка существования пользователя
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      student: true,
      teacher: true
    }
  })

  if (!existingUser) {
    throw new AppError(404, 'User not found')
  }

  // Проверка уникальности email при изменении
  if (validatedData.email && validatedData.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (emailTaken) {
      throw new AppError(400, 'Email already in use')
    }
  }

  // Проверка уникальности номера зачетной книжки при изменении
  if (
    validatedData.studentData?.studentIdNumber &&
    existingUser.student &&
    validatedData.studentData.studentIdNumber !== existingUser.student.studentIdNumber
  ) {
    const studentIdTaken = await prisma.student.findUnique({
      where: { studentIdNumber: validatedData.studentData.studentIdNumber }
    })

    if (studentIdTaken) {
      throw new AppError(400, 'Student ID number already in use')
    }
  }

  // Проверка существования группы при изменении
  if (validatedData.studentData?.groupId) {
    const group = await prisma.group.findUnique({
      where: { id: validatedData.studentData.groupId }
    })

    if (!group) {
      throw new AppError(404, 'Group not found')
    }
  }

  // Обновление пользователя
  const updateData: any = {
    email: validatedData.email,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    patronymic: validatedData.patronymic,
    phone: validatedData.phone,
    status: validatedData.status
  }

  // Обновление данных студента
  if (validatedData.studentData && existingUser.student) {
    updateData.student = {
      update: validatedData.studentData
    }
  }

  // Обновление данных преподавателя
  if (validatedData.teacherData && existingUser.teacher) {
    updateData.teacher = {
      update: validatedData.teacherData
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      patronymic: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      student: true,
      teacher: true,
      admin: true
    }
  })

  const response: ApiResponse = {
    success: true,
    data: { user },
    message: 'User updated successfully'
  }

  res.json(response)
})

// DELETE /api/users/:id - удалить/заблокировать пользователя
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { permanent } = req.query

  const user = await prisma.user.findUnique({
    where: { id }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  if (permanent === 'true') {
    // Полное удаление (только для админа)
    await prisma.user.delete({
      where: { id }
    })

    const response: ApiResponse = {
      success: true,
      message: 'User deleted permanently'
    }

    return res.json(response)
  } else {
    // Блокировка пользователя
    await prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' }
    })

    const response: ApiResponse = {
      success: true,
      message: 'User blocked successfully'
    }

    return res.json(response)
  }
})

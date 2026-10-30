import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '@lab/database'
import { JWTPayload, ApiResponse } from '@lab/types'
import { AppError, asyncHandler } from '../middleware/error.middleware'

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const profileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  patronymic: z.string().optional(),
  phone: z.string().optional()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  // Поиск пользователя
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      status: true
    }
  })

  if (!user) {
    throw new AppError(401, 'Invalid email or password')
  }

  // Проверка статуса
  if (user.status === 'BLOCKED') {
    throw new AppError(403, 'Account is blocked')
  }

  // Проверка пароля
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password')
  }

  // Генерация токена
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role } as JWTPayload,
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  )

  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    },
    message: 'Login successful'
  }

  res.json(response)
})

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    throw new AppError(401, 'Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      patronymic: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      createdAt: true,
      student: true,
      teacher: true,
      admin: true
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

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const data = profileSchema.parse(req.body)
  const duplicate = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } })
  if (duplicate) throw new AppError(400, 'Email already in use')
  const user = await prisma.user.update({ where: { id: userId }, data })
  res.json({ success: true, data: { user } })
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const { currentPassword, newPassword } = passwordSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect')
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } })
  res.json({ success: true, message: 'Password changed successfully' })
})

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) throw new AppError(401, 'Unauthorized')
  if (!req.file) throw new AppError(400, 'Avatar file is required')

  const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, avatarUrl: true }
  })
  res.json({ success: true, data: { user } })
})

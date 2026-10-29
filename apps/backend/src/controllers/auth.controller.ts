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
        role: user.role
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

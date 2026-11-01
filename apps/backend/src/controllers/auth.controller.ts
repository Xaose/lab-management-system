import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '@lab/database'
import { JWTPayload, ApiResponse } from '@lab/types'
import { AppError, asyncHandler } from '../middleware/error.middleware'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

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

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
  language: z.enum(['ru', 'en', 'be'])
})

const resetRequestSchema = z.object({ email: z.string().email() })
const resetVerifySchema = z.object({ resetId: z.string(), code: z.string().length(6) })
const resetPasswordSchema = z.object({ resetId: z.string(), code: z.string().length(6), newPassword: z.string().min(6) })

export const checkPasswordResetAvailability = asyncHandler(async (req: Request, res: Response) => {
  const email = z.string().email().safeParse(req.query.email)
  if (!email.success) {
    res.json({ success: true, data: { available: false } })
    return
  }
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.data.trim(), mode: 'insensitive' } },
    select: { passwordChanged: true }
  })
  res.json({ success: true, data: { available: user?.passwordChanged === true } })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email: rawEmail, password } = loginSchema.parse(req.body)
  const email = rawEmail.trim().toLowerCase()

  // Поиск пользователя
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      theme: true,
      accentColor: true,
      language: true,
      passwordChanged: true,
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
        avatarUrl: user.avatarUrl,
        theme: user.theme,
          accentColor: user.accentColor,
        language: user.language,
        passwordChanged: user.passwordChanged
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
      theme: true,
      accentColor: true,
      language: true,
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
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChanged: true } })
  res.json({ success: true, message: 'Password changed successfully' })
})

const sendResetCode = async (email: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  })
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Восстановление пароля',
    text: `Ваш код восстановления: ${code}. Код действителен 10 минут.`
  })
}

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = resetRequestSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email } })
  if (user?.passwordChanged) {
    const code = String(crypto.randomInt(100000, 1000000))
    const reset = await prisma.passwordReset.create({
      data: { userId: user.id, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    })
    await sendResetCode(user.email, code)
    res.json({ success: true, data: { resetId: reset.id } })
    return
  }
  res.json({ success: true, data: { resetId: null } })
})

export const verifyPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { resetId, code } = resetVerifySchema.parse(req.body)
  const reset = await prisma.passwordReset.findUnique({ where: { id: resetId } })
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.attempts >= 5 || !(await bcrypt.compare(code, reset.codeHash))) {
    if (reset && !reset.usedAt && reset.attempts < 5) await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } })
    throw new AppError(400, 'Invalid or expired reset code')
  }
  res.json({ success: true })
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetId, code, newPassword } = resetPasswordSchema.parse(req.body)
  const reset = await prisma.passwordReset.findUnique({ where: { id: resetId }, include: { user: true } })
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.attempts >= 5 || !(await bcrypt.compare(code, reset.codeHash))) {
    throw new AppError(400, 'Invalid or expired reset code')
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChanged: true } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } })
  ])
  res.json({ success: true })
})

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const preferences = preferencesSchema.parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      theme: preferences.theme,
      accentColor: preferences.accentColor,
      language: preferences.language
    },
    select: { theme: true, accentColor: true, language: true }
  })
  res.json({ success: true, data: { preferences: user } })
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

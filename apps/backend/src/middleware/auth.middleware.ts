import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@lab/types'
import { AppError } from './error.middleware'
import prisma from '@lab/database'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

// Расширяем Request для хранения данных пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true }
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'Account is not active')
    }

    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'))
    }

    next()
  }
}

import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

const facultySchema = z.object({ name: z.string().trim().min(2) })
const programSchema = z.object({ name: z.string().trim().min(2) })

export const getFaculties = asyncHandler(async (_req: Request, res: Response) => {
  const faculties = await prisma.faculty.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { groups: true } } } })
  res.json({ success: true, data: { faculties } })
})

export const createFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { name } = facultySchema.parse(req.body)
  try {
    const faculty = await prisma.faculty.create({ data: { name } })
    res.status(201).json({ success: true, data: { faculty } })
  } catch (error: any) {
    if (error.code === 'P2002') throw new AppError(400, 'Faculty with this name already exists')
    throw error
  }
})

export const deleteFaculty = asyncHandler(async (req: Request, res: Response) => {
  const faculty = await prisma.faculty.findUnique({ where: { id: req.params.id } })
  if (!faculty) throw new AppError(404, 'Faculty not found')
  await prisma.faculty.delete({ where: { id: faculty.id } })
  res.json({ success: true, message: 'Faculty deleted successfully' })
})

export const updateFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { name } = facultySchema.parse(req.body)
  try {
    const faculty = await prisma.faculty.update({ where: { id: req.params.id }, data: { name } })
    res.json({ success: true, data: { faculty } })
  } catch (error: any) {
    if (error.code === 'P2025') throw new AppError(404, 'Faculty not found')
    if (error.code === 'P2002') throw new AppError(400, 'Faculty with this name already exists')
    throw error
  }
})

export const getPrograms = asyncHandler(async (_req: Request, res: Response) => {
  const programs = await prisma.program.findMany({ orderBy: { name: 'asc' } })
  res.json({ success: true, data: { programs } })
})

export const createProgram = asyncHandler(async (req: Request, res: Response) => {
  const { name } = programSchema.parse(req.body)
  try {
    const program = await prisma.program.create({ data: { name } })
    res.status(201).json({ success: true, data: { program } })
  } catch (error: any) {
    if (error.code === 'P2002') throw new AppError(400, 'Program with this name already exists')
    throw error
  }
})

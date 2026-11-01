import { Request, Response } from 'express'
import prisma from '@lab/database'
import path from 'path'
import fs from 'fs'
import unzipper from 'unzipper'
import { AppError, asyncHandler } from '../middleware/error.middleware'
import { getUploadsDir } from '../middleware/upload.middleware'
import crypto from 'crypto'
import { TextDecoder } from 'util'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'

const getOriginalFileName = (name: string) => {
  const decoded = Buffer.from(name, 'latin1').toString('utf8')
  return decoded.includes('\ufffd') ? name : decoded
}

export const getReusableLabWorkFiles = asyncHandler(async (req: Request, res: Response) => {
  const files = await prisma.file.findMany({
    where: { uploadedById: req.user?.userId, labWorkId: { not: null } },
    select: { id: true, originalName: true, size: true, uploadedAt: true, labWork: { select: { title: true, number: true } } },
    orderBy: { uploadedAt: 'desc' },
    take: 100
  })

  res.json({ success: true, data: { files } })
})

export const analyzeLabWorkDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No document uploaded')
  const extension = path.extname(req.file.originalname).toLowerCase()
  try {
    let text = ''
    if (extension === '.pdf') {
      text = (await pdfParse(await fs.promises.readFile(req.file.path))).text
    } else if (extension === '.docx') {
      text = (await mammoth.extractRawText({ path: req.file.path })).value
    } else if (extension === '.txt') {
      const buffer = await fs.promises.readFile(req.file.path)
      const utf8 = buffer.toString('utf8')
      text = utf8.includes('\ufffd') ? new TextDecoder('windows-1251').decode(buffer) : utf8
    } else {
      throw new AppError(400, 'Для анализа поддерживаются PDF, DOCX и TXT')
    }

    const firstPages = text.replace(/\r/g, '').split('\f').slice(0, 2).join('\n')
    const normalized = firstPages.replace(/[ \t]+/g, ' ').trim()
    const numberMatch = normalized.match(/(?:лабораторн(?:ая|ой)\s+работ(?:а|ы)|практическ(?:ая|ой)\s+работ(?:а|ы)|лр)\s*№?\s*([0-9]+)/i)
    const titleMatch = normalized.match(/(?:тема(?:\s+работы)?|название(?:\s+работы)?)\s*[:\-]\s*[«"“]?\s*([^»"”\r\n]+?)[»"”]?(?=\s*(?:\r?\n|$))/i)
    const goalMatch = normalized.match(/цель(?:\s+работы)?\s*[:\-]\s*([\s\S]*?)(?=\n\s*(?:задач|теорет|ход|порядок|оборудован|вывод|требован)|$)/i)
    const procedureMatch = text.replace(/\r/g, '').match(/(?:5[\s.)-]*\s*)?порядок\s+выполнения\s+работы\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:контрольн|вывод|список\s+литератур|литератур|$))/i)
    const firstMeaningfulLine = normalized.split('\n').map(line => line.trim()).find(line => line.length > 3)

    res.json({
      success: true,
      data: {
        number: numberMatch ? Number(numberMatch[1]) : null,
        title: titleMatch?.[1]?.trim() || firstMeaningfulLine || null,
        description: goalMatch?.[1]?.trim() || null,
        requirements: procedureMatch?.[1]?.trim() || null
      }
    })
  } finally {
    removeUploadedFile(req.file.path)
  }
})

export const reuseLabWorkFile = asyncHandler(async (req: Request, res: Response) => {
  const source = await prisma.file.findFirst({
    where: { id: req.body.fileId, uploadedById: req.user?.userId, labWorkId: { not: null } }
  })
  if (!source) throw new AppError(404, 'Reusable file not found')
  const labWork = await prisma.labWork.findUnique({
    where: { id: req.params.id },
    include: { discipline: { include: { teachers: true } } }
  })
  if (!labWork) throw new AppError(404, 'Lab work not found')
  if (req.user?.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } })
    if (labWork.discipline.createdById !== teacher?.id && !labWork.discipline.teachers.some(item => item.teacherId === teacher?.id)) {
      throw new AppError(403, 'Access denied')
    }
  }
  const file = await prisma.file.create({
    data: {
      originalName: source.originalName,
      storedName: `${crypto.randomUUID()}-${source.storedName}`,
      extension: source.extension,
      mimeType: source.mimeType,
      size: source.size,
      path: source.path,
      uploadedById: req.user!.userId,
      labWorkId: labWork.id
    }
  })
  res.status(201).json({ success: true, data: { file } })
})

const removeUploadedFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

const validateUploadedFile = async (
  file: Express.Multer.File,
  allowedFormats: string[],
  maxFileSize: number
): Promise<void> => {
  const extension = path.extname(file.originalname).slice(1).toLowerCase()
  const normalizedFormats = allowedFormats.map(format => format.replace(/^\./, '').toLowerCase())
  const expectedMimeTypes: Record<string, string[]> = {
    pdf: ['application/pdf'],
    doc: ['application/msword'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    rar: ['application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream'],
    txt: ['text/plain'],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg']
  }

  if (!normalizedFormats.includes(extension)) {
    removeUploadedFile(file.path)
    throw new AppError(400, `File format not allowed. Allowed: ${normalizedFormats.join(', ')}`)
  }

  const expectedMimes = expectedMimeTypes[extension]
  if (expectedMimes && !expectedMimes.includes(file.mimetype)) {
    removeUploadedFile(file.path)
    throw new AppError(400, 'File MIME type does not match its extension')
  }

  if (file.size > maxFileSize) {
    removeUploadedFile(file.path)
    throw new AppError(400, 'File exceeds the maximum size for this lab work')
  }

  try {
    if (extension === 'pdf') {
      const handle = await fs.promises.open(file.path, 'r')
      try {
        const header = Buffer.alloc(5)
        await handle.read(header, 0, header.length, 0)
        const tailLength = Math.min(file.size, 1024)
        const tail = Buffer.alloc(tailLength)
        await handle.read(tail, 0, tailLength, Math.max(0, file.size - tailLength))
        if (header.toString('ascii') !== '%PDF-' || !tail.includes(Buffer.from('%%EOF'))) {
          throw new AppError(400, 'Uploaded PDF is invalid or incomplete')
        }
      } finally {
        await handle.close()
      }
    }

    if (extension === 'zip') {
      const directory = await unzipper.Open.file(file.path)
      if (directory.files.length > 1000) {
        throw new AppError(400, 'ZIP archive contains too many entries')
      }

      let uncompressedSize = 0
      for (const entry of directory.files) {
        if (entry.type === 'File') {
          uncompressedSize += entry.uncompressedSize
          if (uncompressedSize > 250 * 1024 * 1024) {
            throw new AppError(400, 'ZIP archive expands beyond the allowed size')
          }
          for await (const chunk of entry.stream()) {
            void chunk
          }
        }
      }
    }
  } catch (error) {
    removeUploadedFile(file.path)
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(400, `Uploaded ${extension.toUpperCase()} file is invalid or corrupted`)
  }
}

// Upload file for submission (STUDENT)
export const uploadSubmissionFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params // submission id
  const userId = req.user?.userId

  if (!req.file) {
    throw new AppError(400, 'No file uploaded')
  }

  const student = await prisma.student.findUnique({
    where: { userId }
  })

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { labWork: true }
  })

  if (!submission) {
    removeUploadedFile(req.file.path)
    throw new AppError(404, 'Submission not found')
  }

  if (submission.studentId !== student?.id) {
    removeUploadedFile(req.file.path)
    throw new AppError(403, 'Access denied')
  }

  if (submission.status !== 'DRAFT' && submission.status !== 'REVISION') {
    removeUploadedFile(req.file.path)
    throw new AppError(400, 'Cannot upload files in current status')
  }

  await validateUploadedFile(req.file, submission.labWork.allowedFormats, submission.labWork.maxFileSize)

  let file
  try {
    file = await prisma.file.create({
      data: {
        originalName: getOriginalFileName(req.file.originalname),
        storedName: req.file.filename,
        extension: path.extname(req.file.originalname),
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedById: userId!,
        submissionId: id
      }
    })
  } catch (error) {
    removeUploadedFile(req.file.path)
    throw error
  }

  res.status(201).json({
    success: true,
    data: { file },
    message: 'File uploaded successfully'
  })
})

// Upload file for lab work (TEACHER, ADMIN)
export const uploadLabWorkFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params // lab work id
  const userId = req.user?.userId

  if (!req.file) {
    throw new AppError(400, 'No file uploaded')
  }

  const labWork = await prisma.labWork.findUnique({
    where: { id },
    include: {
      discipline: {
        include: {
          teachers: true
        }
      }
    }
  })

  if (!labWork) {
    removeUploadedFile(req.file.path)
    throw new AppError(404, 'Lab work not found')
  }

  // Check access for teachers
  if (req.user?.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    })

    const hasAccess = labWork.discipline.createdById === teacher?.id ||
      labWork.discipline.teachers.some(t => t.teacherId === teacher?.id)

    if (!hasAccess) {
      removeUploadedFile(req.file.path)
      throw new AppError(403, 'Access denied')
    }
  }

  await validateUploadedFile(req.file, labWork.allowedFormats, labWork.maxFileSize)

  let file
  try {
    file = await prisma.file.create({
      data: {
        originalName: getOriginalFileName(req.file.originalname),
        storedName: req.file.filename,
        extension: path.extname(req.file.originalname),
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedById: userId!,
        labWorkId: id
      }
    })
  } catch (error) {
    removeUploadedFile(req.file.path)
    throw error
  }

  res.status(201).json({
    success: true,
    data: { file },
    message: 'File uploaded successfully'
  })
})

// Download file
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.userId
  const userRole = req.user?.role

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      submission: {
        include: {
          student: true,
          labWork: {
            include: {
              discipline: {
                include: {
                  teachers: true
                }
              }
            }
          }
        }
      },
      labWork: {
        include: {
          discipline: {
            include: {
              teachers: true
            }
          }
        }
      }
    }
  })

  if (!file) {
    throw new AppError(404, 'File not found')
  }

  // Check access
  let hasAccess = false

  if (userRole === 'ADMIN') {
    hasAccess = true
  } else if (file.submissionId) {
    // Submission file
    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId }
      })
      hasAccess = file.submission?.studentId === student?.id
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId }
      })
      const discipline = file.submission?.labWork.discipline
      hasAccess = discipline?.createdById === teacher?.id ||
        discipline?.teachers.some(t => t.teacherId === teacher?.id) || false
    }
  } else if (file.labWorkId) {
    // Lab work file (materials) - accessible to all students in the discipline
    if (userRole === 'STUDENT') {
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
      hasAccess = student?.group?.disciplines.some(
        d => d.disciplineId === file.labWork?.disciplineId
      ) || false
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId }
      })
      const discipline = file.labWork?.discipline
      hasAccess = discipline?.createdById === teacher?.id ||
        discipline?.teachers.some(t => t.teacherId === teacher?.id) || false
    }
  }

  if (!hasAccess) {
    throw new AppError(403, 'Access denied')
  }

  // Check if file exists
  const resolvedPath = path.resolve(file.path)
  const uploadsRoot = getUploadsDir()
  if (!resolvedPath.startsWith(`${uploadsRoot}${path.sep}`) || !fs.existsSync(resolvedPath)) {
    throw new AppError(404, 'File not found on disk')
  }

  // PDF and images can be previewed inline; other files keep download behavior.
  if (file.mimeType === 'application/pdf' || file.mimeType.startsWith('image/')) {
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`)
    return res.sendFile(resolvedPath)
  }
  res.download(resolvedPath, file.originalName)
})

// Delete file
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.userId
  const userRole = req.user?.role

  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      submission: {
        include: {
          student: true
        }
      },
      labWork: {
        include: {
          discipline: {
            include: {
              teachers: true
            }
          }
        }
      }
    }
  })

  if (!file) {
    throw new AppError(404, 'File not found')
  }

  // Check permissions
  let canDelete = false

  if (userRole === 'ADMIN') {
    canDelete = true
  } else if (file.submissionId && userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId }
    })
    const submission = file.submission
    canDelete = submission?.studentId === student?.id &&
      (submission?.status === 'DRAFT' || submission?.status === 'REVISION')
  } else if (file.labWorkId && userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId }
    })
    const discipline = file.labWork?.discipline
    canDelete = discipline?.createdById === teacher?.id ||
      discipline?.teachers.some(t => t.teacherId === teacher?.id) || false
  }

  if (!canDelete) {
    throw new AppError(403, 'Access denied')
  }

  // Delete file from disk
  const resolvedPath = path.resolve(file.path)
  const uploadsRoot = getUploadsDir()
  if (!resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new AppError(400, 'Invalid file storage path')
  }
  if (fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath)
  }

  // Delete file record
  await prisma.file.delete({
    where: { id }
  })

  res.json({
    success: true,
    message: 'File deleted successfully'
  })
})

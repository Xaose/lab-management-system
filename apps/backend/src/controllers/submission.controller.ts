import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import prisma from '@lab/database'
import { AppError, asyncHandler } from '../middleware/error.middleware'

// Validation schemas
const createSubmissionSchema = z.object({
  labWorkId: z.string()
})

const updateSubmissionSchema = z.object({
  studentComment: z.string().optional()
})

const createReviewSchema = z.object({
  score: z.number().int().min(0).optional(),
  result: z.enum(['ACCEPTED', 'REVISION', 'REJECTED']),
  comment: z.string().optional(),
  criteriaScores: z.array(z.object({
    criterionId: z.string(),
    score: z.number().int().min(0)
  })).optional()
})

const validateReviewScores = (
  score: number | undefined,
  criteriaScores: Array<{ criterionId: string; score: number }> | undefined,
  criteria: Array<{ id: string; maxScore: number }>,
  maxScore: number,
  result: 'ACCEPTED' | 'REVISION' | 'REJECTED',
  comment: string | undefined
) => {
  if (result === 'REVISION' && !comment?.trim()) {
    throw new AppError(400, 'A comment is required when returning a submission for revision')
  }

  if (score !== undefined && score > maxScore) {
    throw new AppError(400, 'Score cannot exceed the lab work maximum score')
  }

  if (!criteriaScores) return

  const criteriaById = new Map(criteria.map(criterion => [criterion.id, criterion]))
  const seen = new Set<string>()
  let total = 0

  for (const criterionScore of criteriaScores) {
    const criterion = criteriaById.get(criterionScore.criterionId)
    if (!criterion || seen.has(criterionScore.criterionId)) {
      throw new AppError(400, 'Invalid criterion score')
    }
    if (criterionScore.score > criterion.maxScore) {
      throw new AppError(400, 'Criterion score cannot exceed its maximum')
    }
    seen.add(criterionScore.criterionId)
    total += criterionScore.score
  }

  if (criteria.length !== seen.size) {
    throw new AppError(400, 'A score is required for every criterion')
  }
  if (total > maxScore || (score !== undefined && score !== total)) {
    throw new AppError(400, 'Total score must equal the sum of criterion scores and not exceed the maximum')
  }
}

// Get submissions (filtered by role)
export const getSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { labWorkId, status, studentId } = req.query
  const userRole = req.user?.role
  const userId = req.user?.userId

  const where: any = {}

  if (labWorkId) {
    where.labWorkId = labWorkId as string
  }

  if (status) {
    where.status = status
  }

  // Студенты видят только свои сдачи
  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId }
    })

    if (!student) {
      throw new AppError(404, 'Student profile not found')
    }

    where.studentId = student.id
  }

  // Преподаватели видят сдачи по своим дисциплинам
  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        disciplinesCreated: true,
        disciplinesTeaching: true
      }
    })

    if (!teacher) {
      throw new AppError(404, 'Teacher profile not found')
    }

    const disciplineIds = [
      ...teacher.disciplinesCreated.map(d => d.id),
      ...teacher.disciplinesTeaching.map(dt => dt.disciplineId)
    ]

    where.labWork = {
      disciplineId: { in: disciplineIds }
    }
  }

  if (studentId && (userRole === 'TEACHER' || userRole === 'ADMIN')) {
    where.studentId = studentId as string
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          group: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      labWork: {
        select: {
          id: true,
          number: true,
          title: true,
          maxScore: true,
          dueDate: true,
          discipline: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      files: true,
      reviews: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          reviewedAt: 'desc'
        },
        take: 1
      },
      _count: {
        select: {
          comments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  res.json({
    success: true,
    data: { submissions }
  })
})

// Get single submission
export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userRole = req.user?.role
  const userId = req.user?.userId

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          group: true
        }
      },
      labWork: {
        include: {
          discipline: true,
          criteria: {
            orderBy: { order: 'asc' }
          }
        }
      },
      files: true,
      reviews: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          criteriaScores: {
            include: {
              criterion: true
            }
          }
        },
        orderBy: {
          reviewedAt: 'desc'
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!submission) {
    throw new AppError(404, 'Submission not found')
  }

  // Проверка доступа
  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId }
    })

    if (submission.studentId !== student?.id) {
      throw new AppError(403, 'Access denied')
    }
  }

  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        disciplinesCreated: true,
        disciplinesTeaching: true
      }
    })

    const disciplineIds = [
      ...teacher!.disciplinesCreated.map(d => d.id),
      ...teacher!.disciplinesTeaching.map(dt => dt.disciplineId)
    ]

    if (!disciplineIds.includes(submission.labWork.disciplineId)) {
      throw new AppError(403, 'Access denied')
    }
  }

  res.json({
    success: true,
    data: { submission }
  })
})

// Create submission (STUDENT)
export const createSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { labWorkId } = createSubmissionSchema.parse(req.body)
  const userId = req.user?.userId

  const student = await prisma.student.findUnique({
    where: { userId }
  })

  if (!student) {
    throw new AppError(404, 'Student profile not found')
  }

  // Проверка лабораторной работы
  const labWork = await prisma.labWork.findUnique({
    where: { id: labWorkId }
  })

  if (!labWork) {
    throw new AppError(404, 'Lab work not found')
  }

  if (labWork.status !== 'PUBLISHED') {
    throw new AppError(400, 'Lab work is not published')
  }

  // Проверка доступа к дисциплине
  const studentGroup = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      group: {
        include: {
          disciplines: true
        }
      }
    }
  })

  const hasAccess = studentGroup?.group.disciplines.some(
    d => d.disciplineId === labWork.disciplineId
  )

  if (!hasAccess) {
    throw new AppError(403, 'You do not have access to this discipline')
  }

  // Проверка количества попыток
  const existingSubmissions = await prisma.submission.findMany({
    where: {
      studentId: student.id,
      labWorkId
    }
  })

  const attemptNumber = existingSubmissions.length + 1

  const latestSubmission = existingSubmissions.sort(
    (left, right) => right.attemptNumber - left.attemptNumber
  )[0]
  if (
    latestSubmission &&
    (latestSubmission.status !== 'REVISION' || !labWork.allowResubmit)
  ) {
    throw new AppError(400, 'A new attempt is only allowed after a revision request')
  }

  if (labWork.maxAttempts && attemptNumber > labWork.maxAttempts) {
    throw new AppError(400, 'Maximum number of attempts reached')
  }

  // Создание сдачи
  const submission = await prisma.submission.create({
    data: {
      studentId: student.id,
      labWorkId,
      attemptNumber,
      status: 'DRAFT'
    },
    include: {
      labWork: {
        select: {
          id: true,
          number: true,
          title: true
        }
      }
    }
  })

  res.status(201).json({
    success: true,
    data: { submission },
    message: 'Submission created successfully'
  })
})

// Update submission (STUDENT - only in DRAFT or REVISION status)
export const updateSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { studentComment } = updateSubmissionSchema.parse(req.body)
  const userId = req.user?.userId

  const student = await prisma.student.findUnique({
    where: { userId }
  })

  const submission = await prisma.submission.findUnique({
    where: { id }
  })

  if (!submission) {
    throw new AppError(404, 'Submission not found')
  }

  if (submission.studentId !== student?.id) {
    throw new AppError(403, 'Access denied')
  }

  if (submission.status !== 'DRAFT' && submission.status !== 'REVISION') {
    throw new AppError(400, 'Cannot update submission in current status')
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: { studentComment }
  })

  res.json({
    success: true,
    data: { submission: updated },
    message: 'Submission updated successfully'
  })
})

// Submit for review (STUDENT)
export const submitForReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.userId

  const student = await prisma.student.findUnique({
    where: { userId }
  })

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      labWork: true,
      files: true
    }
  })

  if (!submission) {
    throw new AppError(404, 'Submission not found')
  }

  if (submission.studentId !== student?.id) {
    throw new AppError(403, 'Access denied')
  }

  if (submission.status !== 'DRAFT' && submission.status !== 'REVISION') {
    throw new AppError(400, 'Cannot submit in current status')
  }

  if (submission.files.length === 0) {
    throw new AppError(400, 'Cannot submit without files')
  }

  // Проверка просрочки
  const now = new Date()
  const isLate = submission.labWork.dueDate ? now > submission.labWork.dueDate : false

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: now,
      isLate
    }
  })

  res.json({
    success: true,
    data: { submission: updated },
    message: 'Submission sent for review'
  })
})

// Create review (TEACHER, ADMIN)
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = createReviewSchema.parse(req.body)
  const userId = req.user?.userId
  const userRole = req.user?.role

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      labWork: {
        include: {
          criteria: true,
          discipline: {
            include: {
              teachers: true
            }
          }
        }
      }
    }
  })

  if (!submission) {
    throw new AppError(404, 'Submission not found')
  }

  if (submission.status !== 'SUBMITTED' && submission.status !== 'IN_REVIEW') {
    throw new AppError(400, 'Submission is not ready for review')
  }

  // Проверка прав преподавателя
  const teacher = await prisma.teacher.findUnique({
    where: { userId }
  })

  if (!teacher) {
    throw new AppError(404, 'Teacher profile not found')
  }

  if (userRole === 'TEACHER') {
    const hasAccess = submission.labWork.discipline.createdById === teacher.id ||
      submission.labWork.discipline.teachers.some(t => t.teacherId === teacher.id)

    if (!hasAccess) {
      throw new AppError(403, 'Access denied')
    }
  }

  validateReviewScores(
    validatedData.score,
    validatedData.criteriaScores,
    submission.labWork.criteria,
    submission.labWork.maxScore,
    validatedData.result,
    validatedData.comment
  )

  const newStatus = validatedData.result === 'REVISION' ? 'REVISION' : 'REVIEWED'
  const review = await prisma.$transaction(async transaction => {
    const createdReview = await transaction.review.create({
      data: {
        submissionId: id,
        teacherId: teacher.id,
        score: validatedData.score,
        result: validatedData.result,
        comment: validatedData.comment,
        criteriaScores: validatedData.criteriaScores ? {
          create: validatedData.criteriaScores
        } : undefined
      },
      include: {
        criteriaScores: {
          include: {
            criterion: true
          }
        }
      }
    })
    await transaction.submission.update({
      where: { id },
      data: { status: newStatus }
    })
    return createdReview
  })

  res.status(201).json({
    success: true,
    data: { review },
    message: 'Review created successfully'
  })
})

// Update review (TEACHER, ADMIN)
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params
  const validatedData = createReviewSchema.partial().parse(req.body)
  const userId = req.user?.userId

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      teacher: true,
      submission: {
        include: {
          labWork: {
            include: {
              criteria: true,
              discipline: {
                include: {
                  teachers: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!review) {
    throw new AppError(404, 'Review not found')
  }

  // Проверка прав
  if (review.teacher.userId !== userId) {
    throw new AppError(403, 'You can only update your own reviews')
  }

  const criteriaScores = validatedData.criteriaScores
    ? validatedData.criteriaScores
    : undefined
  validateReviewScores(
    validatedData.score,
    criteriaScores,
    review.submission.labWork.criteria,
    review.submission.labWork.maxScore,
    validatedData.result || review.result,
    validatedData.comment ?? review.comment ?? undefined
  )

  const updated = await prisma.$transaction(async transaction => {
    if (criteriaScores) {
      await transaction.criterionScore.deleteMany({ where: { reviewId } })
    }
    const updatedReview = await transaction.review.update({
      where: { id: reviewId },
      data: {
        score: validatedData.score,
        result: validatedData.result,
        comment: validatedData.comment,
        criteriaScores: criteriaScores ? { create: criteriaScores } : undefined
      },
      include: {
        criteriaScores: {
          include: {
            criterion: true
          }
        }
      }
    })
    if (validatedData.result) {
      const newStatus = validatedData.result === 'REVISION' ? 'REVISION' : 'REVIEWED'
      await transaction.submission.update({
        where: { id: review.submissionId },
        data: { status: newStatus }
      })
    }
    return updatedReview
  })

  res.json({
    success: true,
    data: { review: updated },
    message: 'Review updated successfully'
  })
})

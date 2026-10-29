import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import {
  getSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  submitForReview,
  createReview,
  updateReview
} from '../controllers/submission.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Submissions
router.get('/', getSubmissions)
router.get('/:id', getSubmission)
router.post('/', authorize('STUDENT'), createSubmission)
router.put('/:id', authorize('STUDENT'), updateSubmission)
router.post('/:id/submit', authorize('STUDENT'), submitForReview)

// Reviews (TEACHER, ADMIN)
router.post('/:id/review', authorize('TEACHER', 'ADMIN'), createReview)
router.put('/reviews/:reviewId', authorize('TEACHER', 'ADMIN'), updateReview)

export default router

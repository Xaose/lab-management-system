import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import {
  getLabWorks,
  getLabWork,
  createLabWork,
  updateLabWork,
  deleteLabWork,
  addCriterion,
  updateCriterion,
  deleteCriterion
} from '../controllers/labwork.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Lab works
router.get('/', getLabWorks)
router.get('/:id', getLabWork)
router.post('/', authorize('TEACHER', 'ADMIN'), createLabWork)
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateLabWork)
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteLabWork)

// Criteria
router.post('/:id/criteria', authorize('TEACHER', 'ADMIN'), addCriterion)
router.put('/criteria/:criterionId', authorize('TEACHER', 'ADMIN'), updateCriterion)
router.delete('/criteria/:criterionId', authorize('TEACHER', 'ADMIN'), deleteCriterion)

export default router

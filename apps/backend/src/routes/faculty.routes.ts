import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { createFaculty, deleteFaculty, getFaculties } from '../controllers/faculty.controller'

const router = Router()
router.use(authenticate)
router.get('/', getFaculties)
router.post('/', authorize('ADMIN'), createFaculty)
router.delete('/:id', authorize('ADMIN'), deleteFaculty)
export default router

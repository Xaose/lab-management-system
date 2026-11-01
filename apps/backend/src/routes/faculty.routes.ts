import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { createFaculty, deleteFaculty, getFaculties, createProgram, getPrograms, updateFaculty } from '../controllers/faculty.controller'

const router = Router()
router.use(authenticate)
router.get('/', getFaculties)
router.post('/', authorize('ADMIN'), createFaculty)
router.put('/:id', authorize('ADMIN'), updateFaculty)
router.delete('/:id', authorize('ADMIN'), deleteFaculty)
router.get('/programs', getPrograms)
router.post('/programs', authorize('ADMIN'), createProgram)
export default router

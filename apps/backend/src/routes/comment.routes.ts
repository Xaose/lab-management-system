import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { createComment, deleteComment, getComments } from '../controllers/comment.controller'

const router = Router()
router.use(authenticate)
router.get('/submissions/:submissionId', authorize('STUDENT', 'TEACHER', 'ADMIN'), getComments)
router.post('/submissions/:submissionId', authorize('STUDENT', 'TEACHER', 'ADMIN'), createComment)
router.delete('/:id', authorize('STUDENT', 'TEACHER', 'ADMIN'), deleteComment)
export default router

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { getStudentProgress, getTeacherAnalytics, exportTeacherGradebook } from '../controllers/analytics.controller'

const router = Router()
router.use(authenticate)
router.get('/student-progress', authorize('STUDENT'), getStudentProgress)
router.get('/teacher', authorize('TEACHER'), getTeacherAnalytics)
router.get('/teacher/export', authorize('TEACHER'), exportTeacherGradebook)
export default router

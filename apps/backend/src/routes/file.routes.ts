import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { uploadSingle } from '../middleware/upload.middleware'
import {
  uploadSubmissionFile,
  uploadLabWorkFile,
  downloadFile,
  deleteFile,
  getReusableLabWorkFiles,
  reuseLabWorkFile,
  analyzeLabWorkDocument
} from '../controllers/file.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Upload files
router.post('/submissions/:id/upload', authorize('STUDENT'), uploadSingle, uploadSubmissionFile)
router.post('/lab-works/:id/upload', authorize('TEACHER', 'ADMIN'), uploadSingle, uploadLabWorkFile)
router.get('/reusable-lab-work-files', authorize('TEACHER', 'ADMIN'), getReusableLabWorkFiles)
router.post('/lab-works/:id/reuse', authorize('TEACHER', 'ADMIN'), reuseLabWorkFile)
router.post('/lab-works/analyze-document', authorize('TEACHER', 'ADMIN'), uploadSingle, analyzeLabWorkDocument)

// Download file
router.get('/:id/download', downloadFile)

// Delete file
router.delete('/:id', deleteFile)

export default router

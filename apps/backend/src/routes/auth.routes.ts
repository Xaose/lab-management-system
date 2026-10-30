import { Router } from 'express'
import { login, getCurrentUser, updateProfile, changePassword, uploadAvatar as saveAvatar } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadAvatar } from '../middleware/upload.middleware'

const router = Router()

router.post('/login', login)
router.get('/me', authenticate, getCurrentUser)
router.put('/profile', authenticate, updateProfile)
router.put('/password', authenticate, changePassword)
router.post('/avatar', authenticate, uploadAvatar, saveAvatar)

export default router

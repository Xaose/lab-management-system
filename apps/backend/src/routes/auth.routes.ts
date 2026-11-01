import { Router } from 'express'
import { login, getCurrentUser, updateProfile, updatePreferences, changePassword, uploadAvatar as saveAvatar, requestPasswordReset, verifyPasswordReset, resetPassword, checkPasswordResetAvailability } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { uploadAvatar } from '../middleware/upload.middleware'

const router = Router()

router.post('/login', login)
router.get('/password-reset-availability', checkPasswordResetAvailability)
router.post('/forgot-password', requestPasswordReset)
router.post('/verify-reset-code', verifyPasswordReset)
router.post('/reset-password', resetPassword)
router.get('/me', authenticate, getCurrentUser)
router.put('/profile', authenticate, updateProfile)
router.put('/preferences', authenticate, updatePreferences)
router.put('/password', authenticate, changePassword)
router.post('/avatar', authenticate, uploadAvatar, saveAvatar)

export default router

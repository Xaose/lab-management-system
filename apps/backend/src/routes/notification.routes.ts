import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getNotifications, markNotificationRead } from '../controllers/notification.controller'

const router = Router()
router.use(authenticate)
router.get('/', getNotifications)
router.patch('/:id/read', markNotificationRead)

export default router

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { getAuditLogs } from '../controllers/audit.controller'

const router = Router()
router.use(authenticate, authorize('ADMIN'))
router.get('/', getAuditLogs)
export default router

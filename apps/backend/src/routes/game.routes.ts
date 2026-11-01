import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getGameLeaderboard, submitGameResult } from '../controllers/game.controller'

const router = Router()
router.use(authenticate)
router.get('/leaderboard', getGameLeaderboard)
router.post('/results', submitGameResult)

export default router

import { Router } from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Все роуты требуют авторизации и роли ADMIN
router.use(authenticate)
router.use(authorize('ADMIN'))

// GET /api/users - список пользователей с фильтрацией
router.get('/', getUsers)

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', getUserById)

// POST /api/users - создать нового пользователя
router.post('/', createUser)

// PUT /api/users/:id - обновить пользователя
router.put('/:id', updateUser)

// DELETE /api/users/:id - заблокировать/удалить пользователя
router.delete('/:id', deleteUser)

export default router

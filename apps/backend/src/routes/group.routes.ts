import { Router } from 'express'
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  assignStudentsToGroup,
  removeStudentFromGroup
} from '../controllers/groups.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Все роуты требуют авторизации
router.use(authenticate)

// GET /api/groups - список групп (доступно всем авторизованным)
router.get('/', getGroups)

// GET /api/groups/:id - получить группу по ID (доступно всем авторизованным)
router.get('/:id', getGroupById)

// Роуты только для администраторов
router.use(authorize('ADMIN'))

// POST /api/groups - создать группу
router.post('/', createGroup)

// PUT /api/groups/:id - обновить группу
router.put('/:id', updateGroup)

// DELETE /api/groups/:id - удалить группу
router.delete('/:id', deleteGroup)

// POST /api/groups/:id/students - назначить студентов в группу
router.post('/:id/students', assignStudentsToGroup)

// DELETE /api/groups/:groupId/students/:studentId - удалить студента из группы
router.delete('/:groupId/students/:studentId', removeStudentFromGroup)

export default router

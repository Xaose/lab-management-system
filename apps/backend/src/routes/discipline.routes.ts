import { Router } from 'express'
import {
  getDisciplines,
  getDisciplineById,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  assignTeachersToDiscipline,
  removeTeacherFromDiscipline,
  assignGroupsToDiscipline,
  removeGroupFromDiscipline
} from '../controllers/disciplines.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Все роуты требуют авторизации
router.use(authenticate)

// GET /api/disciplines - список дисциплин (доступно всем авторизованным)
router.get('/', getDisciplines)

// GET /api/disciplines/:id - получить дисциплину по ID (доступно всем авторизованным)
router.get('/:id', getDisciplineById)

// POST /api/disciplines - создать дисциплину (преподаватели и админы)
router.post('/', authorize('TEACHER', 'ADMIN'), createDiscipline)

// PUT /api/disciplines/:id - обновить дисциплину (создатель или админ)
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateDiscipline)

// DELETE /api/disciplines/:id - удалить дисциплину (создатель или админ)
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteDiscipline)

// Управление преподавателями дисциплины (только админы)
router.post('/:id/teachers', authorize('ADMIN'), assignTeachersToDiscipline)
router.delete('/:disciplineId/teachers/:teacherId', authorize('ADMIN'), removeTeacherFromDiscipline)

// Управление группами дисциплины (только админы)
router.post('/:id/groups', authorize('ADMIN'), assignGroupsToDiscipline)
router.delete('/:disciplineId/groups/:groupId', authorize('ADMIN'), removeGroupFromDiscipline)

export default router

import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import groupRoutes from './routes/group.routes'
import disciplineRoutes from './routes/discipline.routes'
import labWorkRoutes from './routes/labwork.routes'
import submissionRoutes from './routes/submission.routes'
import fileRoutes from './routes/file.routes'
import notificationRoutes from './routes/notification.routes'
import analyticsRoutes from './routes/analytics.routes'
import auditRoutes from './routes/audit.routes'
import facultyRoutes from './routes/faculty.routes'
import commentRoutes from './routes/comment.routes'
import { errorHandler } from './middleware/error.middleware'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app: Application = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/disciplines', disciplineRoutes)
app.use('/api/lab-works', labWorkRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/faculties', facultyRoutes)
app.use('/api/comments', commentRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

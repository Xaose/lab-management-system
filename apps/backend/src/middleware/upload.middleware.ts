import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { Request } from 'express'
import fs from 'fs'

export const getUploadsDir = () => {
  const uploadsDir = path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, '../../../../uploads')
  )

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  return uploadsDir
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, getUploadsDir())
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFormats = ['.pdf', '.docx', '.doc', '.zip', '.rar', '.txt', '.png', '.jpg', '.jpeg']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedFormats.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`File format not allowed. Allowed: ${allowedFormats.join(', ')}`))
  }
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
})

// Multiple files upload
export const uploadMultiple = upload.array('files', 10)

// Single file upload
export const uploadSingle = upload.single('file')

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Avatar must be a PNG, JPEG, or WebP image'))
  }
}).single('avatar')

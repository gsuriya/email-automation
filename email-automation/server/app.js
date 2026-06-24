import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import emailRoutes from './routes/email.js'
import draftTemplateRoutes from './routes/draftTemplates.js'
import coldEmailRowRoutes from './routes/coldEmailRows.js'
import coldEmailSendRoutes from './routes/coldEmailSend.js'
import trackerRoutes from './routes/tracker.js'
import { attachUser, requireUser } from './lib/session.js'

const allowedOrigins = [
  'http://localhost:5173',
  process.env.APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean)

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.includes(origin)) return true
  try {
    const hostname = new URL(origin).hostname
    return hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

export function createApp() {
  const app = express()

  app.use(cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true)
      return callback(new Error('CORS origin is not allowed.'))
    },
    credentials: true,
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(attachUser)

  app.use('/api/auth', authRoutes)
  app.use('/api', requireUser, emailRoutes)
  app.use('/api/draft-templates', requireUser, draftTemplateRoutes)
  app.use('/api/cold-email-rows', requireUser, coldEmailRowRoutes)
  app.use('/api/cold-email', requireUser, coldEmailSendRoutes)
  app.use('/api/tracker', requireUser, trackerRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
  })

  return app
}

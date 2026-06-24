import { Router } from 'express'
import { asyncRoute } from '../lib/http.js'
import { sendGmailMessage } from '../lib/gmail.js'

const router = Router()

router.post('/send-email', asyncRoute(async (req, res) => {
  const { to, cc, bcc, subject, body, attachments } = req.body

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
  }

  try {
    const result = await sendGmailMessage({ userEmail: req.user.email, to, cc, bcc, subject, body, attachments })
    res.json({ success: true, messageId: result.id })
  } catch (err) {
    console.error('Send email error:', err)
    res.status(err.status || 500).json({ error: err.message || 'Failed to send email' })
  }
}))

export default router

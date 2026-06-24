import { Router } from 'express'
import { randomUUID } from 'node:crypto'

import { asyncRoute, requireFields } from '../lib/http.js'
import { getSupabase } from '../lib/supabase.js'

const router = Router()
const MAX_TOTAL_ATTACHMENT_BYTES = 7 * 1024 * 1024

function normalizeTemplateAttachments(value) {
  if (!Array.isArray(value)) return []

  let totalSize = 0
  const attachments = value
    .filter((attachment) => attachment?.name && attachment?.content)
    .map((attachment) => {
      const size = Number(attachment.size || 0)
      totalSize += Number.isFinite(size) ? size : 0

      return {
        id: String(attachment.id || randomUUID()),
        name: String(attachment.name),
        mimeType: String(attachment.mimeType || 'application/octet-stream'),
        size: Number.isFinite(size) ? size : 0,
        content: String(attachment.content),
      }
    })

  if (totalSize > MAX_TOTAL_ATTACHMENT_BYTES) {
    const error = new Error('Attachments must be under 7 MB total.')
    error.status = 400
    throw error
  }

  return attachments
}

router.get('/', asyncRoute(async (req, res) => {
  const { data, error } = await getSupabase()
    .from('draft_templates')
    .select('*')
    .eq('owner_email', req.user.email)
    .order('updated_at', { ascending: false })

  if (error) throw error
  res.json({ templates: data })
}))

router.post('/', asyncRoute(async (req, res) => {
  const message = requireFields(req.body, ['name', 'subject', 'body'])
  if (message) return res.status(400).json({ error: message })

  const { data, error } = await getSupabase()
    .from('draft_templates')
    .insert({
      name: req.body.name.trim(),
      subject: req.body.subject,
      body: req.body.body,
      attachments: normalizeTemplateAttachments(req.body.attachments),
      owner_email: req.user.email,
    })
    .select('*')
    .single()

  if (error) throw error
  res.status(201).json({ template: data })
}))

router.patch('/:id', asyncRoute(async (req, res) => {
  const patch = {}
  for (const field of ['name', 'subject', 'body']) {
    if (field in req.body) patch[field] = field === 'name' ? req.body[field].trim() : req.body[field]
  }
  if ('attachments' in req.body) patch.attachments = normalizeTemplateAttachments(req.body.attachments)

  const { data, error } = await getSupabase()
    .from('draft_templates')
    .update(patch)
    .eq('id', req.params.id)
    .eq('owner_email', req.user.email)
    .select('*')
    .single()

  if (error) throw error
  res.json({ template: data })
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const { error } = await getSupabase()
    .from('draft_templates')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_email', req.user.email)

  if (error) throw error
  res.status(204).end()
}))

export default router

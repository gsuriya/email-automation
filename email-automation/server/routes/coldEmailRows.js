import { Router } from 'express'

import { asyncRoute } from '../lib/http.js'
import { getSupabase } from '../lib/supabase.js'

const router = Router()

const serializeRow = (body, ownerEmail) => ({
  owner_email: ownerEmail,
  name: body.name ?? '',
  company: body.company ?? '',
  email: body.email ?? '',
  draft_template_id: body.draft_template_id || null,
  status: body.status || 'draft',
  error_message: body.error_message || null,
})

const serializePatch = (body) => {
  const patch = {}
  for (const field of ['name', 'company', 'email', 'status', 'error_message']) {
    if (field in body) patch[field] = body[field] ?? ''
  }
  if ('draft_template_id' in body) patch.draft_template_id = body.draft_template_id || null
  return patch
}

async function ensureTemplateOwner(templateId, ownerEmail) {
  if (!templateId) return null

  const { data, error } = await getSupabase()
    .from('draft_templates')
    .select('id')
    .eq('id', templateId)
    .eq('owner_email', ownerEmail)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('Draft template was not found for this user.')
    err.status = 400
    throw err
  }

  return templateId
}

router.get('/', asyncRoute(async (req, res) => {
  const { data, error } = await getSupabase()
    .from('cold_email_rows')
    .select('*, draft_templates(name)')
    .eq('owner_email', req.user.email)
    .order('created_at', { ascending: true })

  if (error) throw error
  res.json({ rows: data })
}))

router.post('/', asyncRoute(async (req, res) => {
  await ensureTemplateOwner(req.body.draft_template_id, req.user.email)

  const { data, error } = await getSupabase()
    .from('cold_email_rows')
    .insert(serializeRow(req.body, req.user.email))
    .select('*')
    .single()

  if (error) throw error
  res.status(201).json({ row: data })
}))

router.patch('/:id', asyncRoute(async (req, res) => {
  if ('draft_template_id' in req.body) {
    await ensureTemplateOwner(req.body.draft_template_id, req.user.email)
  }

  const { data, error } = await getSupabase()
    .from('cold_email_rows')
    .update(serializePatch(req.body))
    .eq('id', req.params.id)
    .eq('owner_email', req.user.email)
    .select('*')
    .single()

  if (error) throw error
  res.json({ row: data })
}))

router.delete('/', asyncRoute(async (req, res) => {
  const { error } = await getSupabase()
    .from('cold_email_rows')
    .delete()
    .eq('owner_email', req.user.email)

  if (error) throw error
  res.status(204).end()
}))

router.delete('/:id', asyncRoute(async (req, res) => {
  const { error } = await getSupabase()
    .from('cold_email_rows')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_email', req.user.email)

  if (error) throw error
  res.status(204).end()
}))

export default router

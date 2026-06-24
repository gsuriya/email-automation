import { Router } from 'express'

import { planColdEmailBatch } from '../lib/coldEmailBatch.js'
import { asyncRoute } from '../lib/http.js'
import { sendGmailMessage } from '../lib/gmail.js'
import { getSupabase } from '../lib/supabase.js'

const router = Router()

router.post('/send-all', asyncRoute(async (req, res) => {
  const supabase = getSupabase()

  const [{ data: rows, error: rowsError }, { data: templates, error: templatesError }] = await Promise.all([
    supabase.from('cold_email_rows').select('*').eq('owner_email', req.user.email).order('created_at', { ascending: true }),
    supabase.from('draft_templates').select('*').eq('owner_email', req.user.email),
  ])

  if (rowsError) throw rowsError
  if (templatesError) throw templatesError

  const planned = planColdEmailBatch({ rows, templates })
  const sent = []
  const failures = [...planned.failures]

  for (const item of planned.readyToSend) {
    try {
      const gmailResult = await sendGmailMessage({
        userEmail: req.user.email,
        to: item.to,
        subject: item.rendered.subject,
        body: item.rendered.body,
        attachments: item.attachments,
      })

      const { error: trackerError } = await supabase.from('tracker_entries').insert({
        owner_email: req.user.email,
        name: item.recipient.name,
        company: item.recipient.company,
        email: item.recipient.email,
        draft_template_id: item.templateId,
        draft_template_name: item.templateName,
        subject: item.rendered.subject,
        body: item.rendered.body,
        attachments: item.attachments,
        gmail_message_id: gmailResult.id,
        status: 'sent',
      })

      if (trackerError) throw trackerError

      const { error: deleteError } = await supabase
        .from('cold_email_rows')
        .delete()
        .eq('id', item.rowId)
        .eq('owner_email', req.user.email)

      if (deleteError) throw deleteError

      sent.push({
        rowId: item.rowId,
        messageId: gmailResult.id,
      })
    } catch (err) {
      failures.push({
        rowId: item.rowId,
        error: err.message || 'Failed to send email.',
      })
    }
  }

  await Promise.all(failures.map((failure) => (
    supabase
      .from('cold_email_rows')
      .update({ status: 'error', error_message: failure.error })
      .eq('id', failure.rowId)
      .eq('owner_email', req.user.email)
  )))

  res.json({
    success: failures.length === 0,
    sent,
    failures,
  })
}))

export default router

import { renderColdEmailTemplate, validateColdEmailRow } from './template.js'

export function planColdEmailBatch({ rows, templates }) {
  const templatesById = new Map(templates.map((template) => [template.id, template]))
  const readyToSend = []
  const failures = []

  for (const row of rows) {
    const template = templatesById.get(row.draft_template_id)
    const validation = validateColdEmailRow({ row, template })

    if (!validation.valid) {
      failures.push({
        rowId: row.id,
        error: validation.errors.join(' '),
      })
      continue
    }

    const rendered = renderColdEmailTemplate({ template, row })
    readyToSend.push({
      rowId: row.id,
      to: row.email,
      templateId: template.id,
      templateName: template.name,
      recipient: {
        name: row.name || '',
        company: row.company || '',
        email: row.email || '',
      },
      rendered,
    })
  }

  return { readyToSend, failures }
}

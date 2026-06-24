import Handlebars from 'handlebars'

const SUPPORTED_PLACEHOLDERS = ['name', 'company', 'email']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function findTemplatePlaceholders({ subject = '', body = '' }) {
  const source = `${subject}\n${body}`
  const found = new Set()
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g
  let match

  while ((match = pattern.exec(source))) {
    const key = match[1]
    if (SUPPORTED_PLACEHOLDERS.includes(key)) found.add(key)
  }

  return [...found].sort()
}

export function renderColdEmailTemplate({ template, row }) {
  const data = {
    name: row.name || '',
    company: row.company || '',
    email: row.email || '',
  }

  return {
    subject: Handlebars.compile(template.subject || '', { noEscape: true })(data),
    body: Handlebars.compile(template.body || '', { noEscape: true })(data),
  }
}

export function validateColdEmailRow({ row, template }) {
  const errors = []
  const email = String(row.email || '').trim()

  if (!EMAIL_RE.test(email)) errors.push('Enter a valid email address.')
  if (!row.draft_template_id || !template) errors.push('Assign a draft template.')

  if (template) {
    for (const placeholder of findTemplatePlaceholders(template)) {
      if (!String(row[placeholder] || '').trim()) {
        const label = placeholder.charAt(0).toUpperCase() + placeholder.slice(1)
        errors.push(`${label} is required by the selected template.`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

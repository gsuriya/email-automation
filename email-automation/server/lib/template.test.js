import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findTemplatePlaceholders,
  renderColdEmailTemplate,
  validateColdEmailRow,
} from './template.js'

describe('cold email template helpers', () => {
  it('finds unique supported placeholders in subject and body', () => {
    const placeholders = findTemplatePlaceholders({
      subject: 'Quick note for {{ company }}',
      body: 'Hi {{name}}, is {{company}} hiring from {{company}}?',
    })

    assert.deepEqual(placeholders, ['company', 'name'])
  })

  it('renders subject and body with row fields', () => {
    const rendered = renderColdEmailTemplate({
      template: {
        subject: 'Intro for {{company}}',
        body: 'Hi {{name}}, I saw {{company}} uses {{email}}.',
      },
      row: {
        name: 'Sam',
        company: 'Acme',
        email: 'sam@acme.com',
      },
    })

    assert.equal(rendered.subject, 'Intro for Acme')
    assert.equal(rendered.body, 'Hi Sam, I saw Acme uses sam@acme.com.')
  })

  it('rejects a row missing email, assigned template, or required placeholder values', () => {
    const result = validateColdEmailRow({
      row: { name: '', company: 'Acme', email: 'not-an-email', draft_template_id: null },
      template: { subject: 'Hi {{name}}', body: 'Company: {{company}}' },
    })

    assert.equal(result.valid, false)
    assert.deepEqual(result.errors, [
      'Enter a valid email address.',
      'Assign a draft template.',
      'Name is required by the selected template.',
    ])
  })
})

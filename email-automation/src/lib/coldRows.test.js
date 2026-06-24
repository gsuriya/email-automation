import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { toColdRowPayload } from './coldRows.js'

describe('toColdRowPayload', () => {
  it('keeps current editable recipient values when preparing a row save', () => {
    assert.deepEqual(toColdRowPayload({
      name: 'Suriya',
      company: 'Acme',
      email: 'suriya@example.com',
      draft_template_id: 'template-1',
      status: 'error',
      error_message: 'Old error',
    }), {
      name: 'Suriya',
      company: 'Acme',
      email: 'suriya@example.com',
      draft_template_id: 'template-1',
      status: 'draft',
      error_message: null,
    })
  })
})

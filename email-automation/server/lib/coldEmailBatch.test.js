import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { planColdEmailBatch } from './coldEmailBatch.js'

describe('planColdEmailBatch', () => {
  it('renders valid rows and reports invalid rows without stopping the batch', () => {
    const result = planColdEmailBatch({
      rows: [
        {
          id: 'row-valid',
          name: 'Nina',
          company: 'Northwind',
          email: 'nina@northwind.com',
          draft_template_id: 'template-1',
        },
        {
          id: 'row-invalid',
          name: '',
          company: 'Acme',
          email: 'bad',
          draft_template_id: 'template-1',
        },
      ],
      templates: [
        {
          id: 'template-1',
          name: 'Intro',
          subject: 'Quick note for {{company}}',
          body: 'Hi {{name}}, reaching out at {{email}}.',
          attachments: [
            {
              name: 'resume.pdf',
              mimeType: 'application/pdf',
              size: 4,
              content: 'dGVzdA==',
            },
          ],
        },
      ],
    })

    assert.deepEqual(result.readyToSend, [
      {
        rowId: 'row-valid',
        to: 'nina@northwind.com',
        templateId: 'template-1',
        templateName: 'Intro',
        attachments: [
          {
            name: 'resume.pdf',
            mimeType: 'application/pdf',
            size: 4,
            content: 'dGVzdA==',
          },
        ],
        recipient: {
          name: 'Nina',
          company: 'Northwind',
          email: 'nina@northwind.com',
        },
        rendered: {
          subject: 'Quick note for Northwind',
          body: 'Hi Nina, reaching out at nina@northwind.com.',
        },
      },
    ])

    assert.deepEqual(result.failures, [
      {
        rowId: 'row-invalid',
        error: 'Enter a valid email address. Name is required by the selected template.',
      },
    ])
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildRawEmail } from './gmail.js'

function decodeRaw(raw) {
  return Buffer.from(raw, 'base64url').toString('utf8')
}

describe('buildRawEmail', () => {
  it('builds multipart messages when attachments are present', () => {
    const decoded = decodeRaw(buildRawEmail({
      to: 'alex@example.com',
      subject: 'Resume for Acme',
      body: 'Hi Alex,',
      attachments: [
        {
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          size: 4,
          content: 'dGVzdA==',
        },
      ],
    }))

    assert.match(decoded, /Content-Type: multipart\/mixed; boundary="/)
    assert.match(decoded, /Content-Type: text\/plain; charset="UTF-8"/)
    assert.match(decoded, /Content-Type: application\/pdf; name="=\?UTF-8\?B\?cmVzdW1lLnBkZg==\?="/)
    assert.match(decoded, /Content-Disposition: attachment; filename="=\?UTF-8\?B\?cmVzdW1lLnBkZg==\?="/)
    assert.match(decoded, /dGVzdA==/)
  })
})

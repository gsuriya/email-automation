import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { GOOGLE_OAUTH_SCOPES } from './googleScopes.js'

describe('GOOGLE_OAUTH_SCOPES', () => {
  it('requests Gmail send and email identity scopes', () => {
    assert.deepEqual(GOOGLE_OAUTH_SCOPES, [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ])
  })
})

import { google } from 'googleapis'

import { getSupabase } from './supabase.js'

function env(name) {
  return process.env[name]?.trim()
}

export function getOAuth2Client(redirectUri = process.env.GOOGLE_REDIRECT_URI) {
  return new google.auth.OAuth2(
    env('GOOGLE_CLIENT_ID'),
    env('GOOGLE_CLIENT_SECRET'),
    redirectUri?.trim()
  )
}

export function buildRawEmail({ to, cc, bcc, subject, body }) {
  const lines = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].filter(Boolean)

  return Buffer.from(lines.join('\r\n')).toString('base64url')
}

export async function getTokenByEmail(email) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveGoogleTokens({ email, name, picture, tokens }) {
  const supabase = getSupabase()
  const existing = await getTokenByEmail(email)
  const refreshToken = tokens.refresh_token || existing?.refresh_token

  const { error } = await supabase
    .from('gmail_tokens')
    .upsert({
      email,
      name: name || existing?.name || email,
      picture: picture || existing?.picture || null,
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      expiry_date: tokens.expiry_date,
    }, { onConflict: 'email' })

  if (error) throw error
}

export async function getAuthorizedGmail(email) {
  const token = await getTokenByEmail(email)
  if (!token) {
    const error = new Error('Not authenticated. Please connect Gmail first.')
    error.status = 401
    throw error
  }

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date,
  })

  if (token.expiry_date < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await saveGoogleTokens({
      email: token.email,
      tokens: {
        ...credentials,
        refresh_token: credentials.refresh_token || token.refresh_token,
      },
    })
    oauth2Client.setCredentials({
      ...credentials,
      refresh_token: credentials.refresh_token || token.refresh_token,
    })
  }

  return {
    email: token.email,
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
  }
}

export async function sendGmailMessage({ userEmail, to, cc, bcc, subject, body }) {
  const { gmail } = await getAuthorizedGmail(userEmail)
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: buildRawEmail({ to, cc, bcc, subject, body }),
    },
  })

  return result.data
}

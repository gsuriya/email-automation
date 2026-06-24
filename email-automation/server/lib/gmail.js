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

function encodeMimeWord(value = '') {
  return `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`
}

function wrapBase64(value = '') {
  return String(value).replace(/(.{76})/g, '$1\r\n')
}

function getAttachmentContent(attachment) {
  const content = String(attachment?.content || '')
  const [, dataUrlContent] = content.match(/^data:[^;]+;base64,(.*)$/) || []
  return (dataUrlContent || content).replace(/\s/g, '')
}

export function normalizeEmailAttachments(attachments = []) {
  return attachments
    .filter((attachment) => attachment?.name && attachment?.content)
    .map((attachment) => ({
      name: String(attachment.name),
      mimeType: String(attachment.mimeType || 'application/octet-stream'),
      size: Number(attachment.size || 0),
      content: getAttachmentContent(attachment),
    }))
}

export function buildRawEmail({ to, cc, bcc, subject, body, attachments = [] }) {
  const normalizedAttachments = normalizeEmailAttachments(attachments)

  if (normalizedAttachments.length) {
    const boundary = `email_automation_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
    const lines = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      bcc ? `Bcc: ${bcc}` : null,
      'MIME-Version: 1.0',
      `Subject: ${encodeMimeWord(subject)}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(Buffer.from(body || '', 'utf8').toString('base64')),
      ...normalizedAttachments.flatMap((attachment) => [
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}; name="${encodeMimeWord(attachment.name)}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${encodeMimeWord(attachment.name)}"`,
        '',
        wrapBase64(attachment.content),
      ]),
      `--${boundary}--`,
      '',
    ].filter((line) => line !== null)

    return Buffer.from(lines.join('\r\n')).toString('base64url')
  }

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

export async function updateGoogleProfile({ email, name, picture }) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('gmail_tokens')
    .update({
      name: name || email,
      picture: picture || null,
    })
    .eq('email', email)

  if (error) throw error
}

export async function getAuthorizedOAuth2Client(email) {
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

  return { email: token.email, oauth2Client }
}

export async function syncGoogleProfile(email) {
  const { oauth2Client } = await getAuthorizedOAuth2Client(email)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const profile = await oauth2.userinfo.get()
  if (!profile.data.email) return null

  await updateGoogleProfile({
    email: profile.data.email,
    name: profile.data.name || profile.data.email,
    picture: profile.data.picture || '',
  })

  return {
    email: profile.data.email,
    name: profile.data.name || profile.data.email,
    picture: profile.data.picture || '',
  }
}

export async function getAuthorizedGmail(email) {
  const { email: tokenEmail, oauth2Client } = await getAuthorizedOAuth2Client(email)
  return {
    email: tokenEmail,
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
  }
}

export async function sendGmailMessage({ userEmail, to, cc, bcc, subject, body, attachments }) {
  const { gmail } = await getAuthorizedGmail(userEmail)
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: buildRawEmail({ to, cc, bcc, subject, body, attachments }),
    },
  })

  return result.data
}

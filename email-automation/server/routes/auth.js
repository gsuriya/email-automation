import { Router } from 'express'
import { google } from 'googleapis'

import { asyncRoute } from '../lib/http.js'
import { getOAuth2Client, getTokenByEmail, saveGoogleTokens, syncGoogleProfile } from '../lib/gmail.js'
import { GOOGLE_OAUTH_SCOPES } from '../lib/googleScopes.js'
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  createOAuthState,
  setOAuthStateCookie,
  setSessionCookie,
  verifyOAuthState,
} from '../lib/session.js'

const router = Router()

function getAppOrigin(req) {
  const origin = req.get('origin')
  if (origin) return origin

  const proto = req.get('x-forwarded-proto') || req.protocol || 'http'
  const host = req.get('x-forwarded-host') || req.get('host')
  return `${proto}://${host}`
}

function getRedirectUri(req) {
  return `${getAppOrigin(req)}/auth/callback`
}

function serializeUser(token) {
  return {
    email: token.email,
    name: token.name || token.email,
    picture: token.picture || '',
  }
}

router.get('/url', (req, res) => {
  const redirectUri = getRedirectUri(req)
  const oauth2Client = getOAuth2Client(redirectUri)
  const state = createOAuthState()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_OAUTH_SCOPES,
    state,
  })

  setOAuthStateCookie(req, res, state)
  res.json({ url })
})

router.get('/status', asyncRoute(async (req, res) => {
  if (!req.user?.email) return res.json({ authenticated: false })

  const token = await getTokenByEmail(req.user.email)
  if (!token) return res.json({ authenticated: false })

  let user = serializeUser(token)
  if (!token.picture || !token.name || token.name === token.email) {
    try {
      user = await syncGoogleProfile(token.email) || user
    } catch (err) {
      console.error('Google profile sync error:', err)
    }
  }

  res.json({
    authenticated: true,
    user,
    email: token.email,
  })
}))

router.post('/logout', (req, res) => {
  clearSessionCookie(req, res)
  res.status(204).end()
})

router.post('/callback', asyncRoute(async (req, res) => {
  const { code, state } = req.body
  if (!code) return res.status(400).json({ error: 'Missing code' })
  if (!verifyOAuthState(req, state)) return res.status(400).json({ error: 'Invalid OAuth state. Please try signing in again.' })

  try {
    const redirectUri = getRedirectUri(req)
    const oauth2Client = getOAuth2Client(redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const profile = await oauth2.userinfo.get()
    const email = profile.data.email

    if (!email) return res.status(400).json({ error: 'Google did not return an email address.' })

    const user = {
      email,
      name: profile.data.name || email,
      picture: profile.data.picture || '',
    }

    await saveGoogleTokens({ ...user, tokens })
    clearOAuthStateCookie(req, res)
    setSessionCookie(req, res, user)

    res.json({ success: true, user, email })
  } catch (err) {
    console.error('Token exchange error:', err)
    res.status(500).json({ error: 'Failed to exchange code for tokens' })
  }
}))

export default router

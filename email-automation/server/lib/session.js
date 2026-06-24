import crypto from 'node:crypto'

const SESSION_COOKIE = 'ea_session'
const OAUTH_STATE_COOKIE = 'ea_oauth_state'
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || 'email-automation-dev-session'
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function parseCookies(req) {
  const header = req.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        if (index === -1) return [part, '']
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      })
  )
}

function cookieOptions(req, maxAgeSeconds) {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https'
  return [
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
    isSecure ? 'Secure' : null,
  ].filter(Boolean).join('; ')
}

export function createOAuthState() {
  return crypto.randomBytes(24).toString('base64url')
}

export function setOAuthStateCookie(req, res, state) {
  res.setHeader('Set-Cookie', `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieOptions(req, 600)}`)
}

export function verifyOAuthState(req, state) {
  const expected = parseCookies(req)[OAUTH_STATE_COOKIE]
  if (!expected || !state || expected.length !== state.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(state))
}

export function clearOAuthStateCookie(req, res) {
  res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=; ${cookieOptions(req, 0)}`)
}

export function setSessionCookie(req, res, user) {
  const payload = base64Url(JSON.stringify({
    email: user.email,
    name: user.name || user.email,
    picture: user.picture || '',
  }))
  const value = `${payload}.${sign(payload)}`
  res.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(value)}; ${cookieOptions(req, ONE_WEEK_SECONDS)}`)
}

export function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(req, 0)}`)
}

export function readSession(req) {
  const value = parseCookies(req)[SESSION_COOKIE]
  if (!value) return null

  const [payload, signature] = value.split('.')
  if (!payload || !signature || sign(payload) !== signature) return null

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!user.email) return null
    return user
  } catch {
    return null
  }
}

export function attachUser(req, _res, next) {
  req.user = readSession(req)
  next()
}

export function requireUser(req, res, next) {
  if (!req.user?.email) {
    return res.status(401).json({ error: 'Please sign in with Google.' })
  }
  next()
}

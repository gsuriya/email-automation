import { api } from './api'

export async function getGoogleAuthUrl() {
  const { url } = await api.authUrl()
  return url
}

export async function exchangeCode(params) {
  return api.exchangeCode(params)
}

export async function checkAuthStatus() {
  return api.authStatus()
}

export async function sendEmail({ to, cc, bcc, subject, body }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, cc, bcc, subject, body }),
  })
  return res.json()
}

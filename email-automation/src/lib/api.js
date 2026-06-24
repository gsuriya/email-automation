async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json()
      message = data.error || message
    } catch {
      message = res.statusText || message
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  authStatus: () => request('/api/auth/status'),
  authUrl: () => request('/api/auth/url'),
  exchangeCode: ({ code, state }) => request('/api/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  listTemplates: () => request('/api/draft-templates'),
  createTemplate: (template) => request('/api/draft-templates', {
    method: 'POST',
    body: JSON.stringify(template),
  }),
  updateTemplate: (id, patch) => request(`/api/draft-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }),
  deleteTemplate: (id) => request(`/api/draft-templates/${id}`, { method: 'DELETE' }),

  listColdRows: () => request('/api/cold-email-rows'),
  createColdRow: (row) => request('/api/cold-email-rows', {
    method: 'POST',
    body: JSON.stringify(row),
  }),
  updateColdRow: (id, patch) => request(`/api/cold-email-rows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }),
  deleteColdRow: (id) => request(`/api/cold-email-rows/${id}`, { method: 'DELETE' }),
  deleteAllColdRows: () => request('/api/cold-email-rows', { method: 'DELETE' }),
  sendAllColdRows: () => request('/api/cold-email/send-all', { method: 'POST' }),

  listTrackerEntries: () => request('/api/tracker'),
}

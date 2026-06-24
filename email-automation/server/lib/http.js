export function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] ?? '').trim())
  if (!missing.length) return null
  return `Missing required fields: ${missing.join(', ')}`
}

export function toColdRowPayload(row) {
  return {
    name: row.name || '',
    company: row.company || '',
    email: row.email || '',
    draft_template_id: row.draft_template_id || null,
    status: 'draft',
    error_message: null,
  }
}

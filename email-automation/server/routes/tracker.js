import { Router } from 'express'

import { asyncRoute } from '../lib/http.js'
import { getSupabase } from '../lib/supabase.js'

const router = Router()

router.get('/', asyncRoute(async (req, res) => {
  const { data, error } = await getSupabase()
    .from('tracker_entries')
    .select('*')
    .eq('owner_email', req.user.email)
    .order('sent_at', { ascending: false })

  if (error) throw error
  res.json({ entries: data })
}))

export default router

import { NextRequest } from 'next/server'

export function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-dashboard-secret')
  if (secret && secret === process.env.DASHBOARD_SECRET) return true

  const cookie = req.cookies.get('dashboard_session')
  if (cookie && cookie.value === process.env.DASHBOARD_SECRET) return true

  return false
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const USER = process.env.LOGIN_USER ?? 'icyber'
const PASS = process.env.LOGIN_PASS ?? 'admin'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username !== USER || password !== PASS) {
    return NextResponse.json({ error: 'Fel användarnamn eller lösenord' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('dashme_auth', process.env.DASHBOARD_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })
  return res
}

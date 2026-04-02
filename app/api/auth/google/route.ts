import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gsc'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.DASHBOARD_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.redirect(getAuthUrl())
}

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gsc'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.DASHBOARD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = getAuthUrl()
  return NextResponse.redirect(url)
}

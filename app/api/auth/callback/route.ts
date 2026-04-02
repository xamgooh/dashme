import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, listProperties } from '@/lib/gsc'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
const COLORS = ['#818cf8','#34d399','#f472b6','#fb923c','#38bdf8','#a78bfa','#4ade80','#fbbf24']
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/dashboard?error=denied', req.url))
  try {
    const tokens = await exchangeCode(code)
    if (!tokens.access_token || !tokens.refresh_token) return NextResponse.redirect(new URL('/dashboard?error=no_tokens', req.url))
    const props = await listProperties(tokens.access_token, tokens.refresh_token)
    const existing = new Set((await db.site.findMany({ select: { propertyUrl: true } })).map((s: { propertyUrl: string }) => s.propertyUrl))
    const count = await db.site.count()
    await Promise.all(
      props
        .filter((p: { siteUrl?: string | null }) => p.siteUrl && !existing.has(p.siteUrl))
        .map((p: { siteUrl?: string | null }, i: number) => db.site.create({ data: {
          url: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
          propertyUrl: p.siteUrl!,
          displayName: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token!,
          tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600000),
          color: COLORS[(count + i) % COLORS.length],
        }}))
    )
    const res = NextResponse.redirect(new URL('/dashboard', req.url))
    res.cookies.set('ds', process.env.DASHBOARD_SECRET!, { httpOnly: true, secure: true, maxAge: 86400 * 30, path: '/' })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.redirect(new URL('/dashboard?error=failed', req.url))
  }
}

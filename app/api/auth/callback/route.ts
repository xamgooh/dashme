import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, listGscProperties } from '@/lib/gsc'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_COLORS = [
  '#818cf8', '#34d399', '#f472b6', '#fb923c',
  '#38bdf8', '#a78bfa', '#4ade80', '#fbbf24',
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard?error=oauth_denied', req.url))
  }

  try {
    const tokens = await exchangeCode(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/dashboard?error=no_tokens', req.url))
    }

    const properties = await listGscProperties(tokens.access_token, tokens.refresh_token)

    const existingSites = await db.site.findMany({ select: { propertyUrl: true } })
    const existingUrls = new Set(existingSites.map((s: { propertyUrl: string }) => s.propertyUrl))
    const siteCount = await db.site.count()

    const newSites = properties.filter(
      (p: { siteUrl?: string | null }) => p.siteUrl && !existingUrls.has(p.siteUrl)
    )

    await Promise.all(
      newSites.map((p: { siteUrl?: string | null }, i: number) =>
        db.site.create({
          data: {
            url: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
            propertyUrl: p.siteUrl!,
            displayName: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
            color: SITE_COLORS[(siteCount + i) % SITE_COLORS.length],
          },
        })
      )
    )

    const res = NextResponse.redirect(new URL('/dashboard?synced=1', req.url))
    res.cookies.set('dashboard_session', process.env.DASHBOARD_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return res
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', req.url))
  }
}

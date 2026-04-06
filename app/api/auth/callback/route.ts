import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, listProperties, getAccountEmail } from '@/lib/gsc'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

const COLORS = ['#818cf8','#34d399','#f472b6','#fb923c','#38bdf8','#a78bfa','#4ade80','#fbbf24']

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/dashboard?error=denied', req.url))

  try {
    const tokens = await exchangeCode(code)
    if (!tokens.access_token || !tokens.refresh_token)
      return NextResponse.redirect(new URL('/dashboard?error=no_tokens', req.url))

    const [props, email] = await Promise.all([
      listProperties(tokens.access_token, tokens.refresh_token),
      getAccountEmail(tokens.access_token),
    ])

    const expiry = new Date(tokens.expiry_date ?? Date.now() + 3600000)

    // Upsert account — creates new or reconnects existing
    const account = await db.account.upsert({
      where: { email },
      update: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry:  expiry,
        connected:    true,
      },
      create: {
        email,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry:  expiry,
        connected:    true,
      },
    })

    // Add any new sites not already in DB
    const existing = new Set(
      (await db.site.findMany({ where: { accountId: account.id }, select: { propertyUrl: true } }))
        .map((s: { propertyUrl: string }) => s.propertyUrl)
    )
    const siteCount = await db.site.count()

    await Promise.all(
      props
        .filter((p: { siteUrl?: string | null }) => p.siteUrl && !existing.has(p.siteUrl))
        .map((p: { siteUrl?: string | null }, i: number) => db.site.create({ data: {
          accountId:   account.id,
          url:         (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
          propertyUrl: p.siteUrl!,
          displayName: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
          color:       COLORS[(siteCount + i) % COLORS.length],
        }}))
    )

    return NextResponse.redirect(new URL('/dashboard/accounts', req.url))
  } catch (e) {
    console.error(e)
    return NextResponse.redirect(new URL('/dashboard?error=failed', req.url))
  }
}

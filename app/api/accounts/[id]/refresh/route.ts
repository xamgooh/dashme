import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { listProperties } from '@/lib/gsc'
import { OAuth2Client } from 'google-auth-library'
export const dynamic = 'force-dynamic'

const COLORS = ['#6366f1','#10b981','#ec4899','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316']

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await db.account.findUniqueOrThrow({
      where: { id: params.id },
      include: { sites: { select: { propertyUrl: true } } },
    })

    if (!account.connected) {
      return Response.json({ error: 'Account is disconnected' }, { status: 400 })
    }

    // Refresh token if needed
    const c = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    )
    c.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.tokenExpiry.getTime(),
    })
    c.on('tokens', async (t) => {
      if (t.access_token) await db.account.update({
        where: { id: params.id },
        data: { accessToken: t.access_token, tokenExpiry: new Date(t.expiry_date ?? Date.now() + 3600000) },
      })
    })
    const { credentials } = await c.refreshAccessToken()

    const props = await listProperties(credentials.access_token!, account.refreshToken)

    const existingUrls = new Set(account.sites.map((s: { propertyUrl: string }) => s.propertyUrl))
    const siteCount = await db.site.count()

    const newSites = props.filter((p: { siteUrl?: string | null }) => p.siteUrl && !existingUrls.has(p.siteUrl))

    await Promise.all(
      newSites.map((p: { siteUrl?: string | null }, i: number) =>
        db.site.create({
          data: {
            accountId:   params.id,
            url:         (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
            propertyUrl: p.siteUrl!,
            displayName: (p.siteUrl ?? '').replace(/^sc-domain:/, '').replace(/\/$/, ''),
            active:      false, // new sites start inactive — user must explicitly enable
            color:       COLORS[(siteCount + i) % COLORS.length],
          },
        })
      )
    )

    return Response.json({ ok: true, added: newSites.length })
  } catch (e: any) {
    console.error('Refresh error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { db } from './db'

function client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl() {
  return client().generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/webmasters.readonly'],
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string) {
  const { tokens } = await client().getToken(code)
  return tokens
}

export async function getAccountEmail(accessToken: string): Promise<string> {
  try {
    const c = client()
    c.setCredentials({ access_token: accessToken })
    const { data } = await google.oauth2({ version: 'v2', auth: c }).userinfo.get()
    return data.email ?? 'unknown'
  } catch { return 'unknown' }
}

export async function listProperties(accessToken: string, refreshToken: string) {
  const c = client()
  c.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const { data } = await google.searchconsole({ version: 'v1', auth: c }).sites.list()
  return data.siteEntry ?? []
}

export async function syncSite(siteId: string) {
  const site = await db.site.findUniqueOrThrow({
    where: { id: siteId },
    include: { account: true },
  })

  if (!site.account.connected) return

  const c = client()
  c.setCredentials({
    access_token: site.account.accessToken,
    refresh_token: site.account.refreshToken,
    expiry_date: site.account.tokenExpiry.getTime(),
  })
  c.on('tokens', async (t) => {
    if (t.access_token) await db.account.update({
      where: { id: site.accountId },
      data: { accessToken: t.access_token, tokenExpiry: new Date(t.expiry_date ?? Date.now() + 3600000) },
    })
  })

  const sc = google.searchconsole({ version: 'v1', auth: c })
  const now   = new Date()
  const end   = now.toISOString().split('T')[0]
  const mid   = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0]
  const start = new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0]

  type Row = { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }

  const base = { siteUrl: site.propertyUrl }
  const [daily, pagesRecent, pagesPrev, kws, countries] = await Promise.all([
    sc.searchanalytics.query({ ...base, requestBody: { startDate: start, endDate: end,   dimensions: ['date'],    rowLimit: 28 } }),
    sc.searchanalytics.query({ ...base, requestBody: { startDate: mid,   endDate: end,   dimensions: ['page'],    rowLimit: 100 } }),
    sc.searchanalytics.query({ ...base, requestBody: { startDate: start, endDate: mid,   dimensions: ['page'],    rowLimit: 100 } }),
    sc.searchanalytics.query({ ...base, requestBody: { startDate: start, endDate: end,   dimensions: ['query'],   rowLimit: 100 } }),
    sc.searchanalytics.query({ ...base, requestBody: { startDate: start, endDate: end,   dimensions: ['country'], rowLimit: 100 } }),
  ])

  const prevMap: Record<string, number> = {}
  for (const r of (pagesPrev.data.rows ?? []) as Row[]) {
    if (r.keys?.[0]) prevMap[r.keys[0]] = r.clicks ?? 0
  }

  const pageData = ((pagesRecent.data.rows ?? []) as Row[]).map((r: Row) => {
    const url = r.keys![0]
    const curr = r.clicks ?? 0
    const prev = prevMap[url] ?? 0
    const trend = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0
    return { url, clicks: curr, impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0, trend }
  })

  await db.$transaction([
    db.siteMetric.deleteMany({ where: { siteId } }),
    db.sitePage.deleteMany({ where: { siteId } }),
    db.siteKeyword.deleteMany({ where: { siteId } }),
    db.siteCountry.deleteMany({ where: { siteId } }),
    ...(daily.data.rows ?? []).map((r: Row) => db.siteMetric.create({ data: {
      siteId, date: new Date(r.keys![0]), clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0,
    }})),
    ...pageData.map(p => db.sitePage.create({ data: {
      siteId, pageUrl: p.url, clicks: p.clicks,
      impressions: p.impressions, ctr: p.ctr, position: p.position, trendPct: p.trend,
    }})),
    ...(kws.data.rows ?? []).map((r: Row) => db.siteKeyword.create({ data: {
      siteId, keyword: r.keys![0], clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0,
    }})),
    ...(countries.data.rows ?? []).map((r: Row) => db.siteCountry.create({ data: {
      siteId, country: r.keys![0], clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0,
    }})),
    db.site.update({ where: { id: siteId }, data: { lastSynced: new Date() } }),
  ])
}

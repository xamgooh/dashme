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
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string) {
  const { tokens } = await client().getToken(code)
  return tokens
}

export async function listProperties(accessToken: string, refreshToken: string) {
  const c = client()
  c.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  const sc = google.searchconsole({ version: 'v1', auth: c })
  const { data } = await sc.sites.list()
  return data.siteEntry ?? []
}

export async function syncSite(siteId: string) {
  const site = await db.site.findUniqueOrThrow({ where: { id: siteId } })
  const c = client()
  c.setCredentials({
    access_token: site.accessToken,
    refresh_token: site.refreshToken,
    expiry_date: site.tokenExpiry.getTime(),
  })
  c.on('tokens', async (t) => {
    if (t.access_token) await db.site.update({
      where: { id: siteId },
      data: { accessToken: t.access_token, tokenExpiry: new Date(t.expiry_date ?? Date.now() + 3600000) },
    })
  })

  const sc = google.searchconsole({ version: 'v1', auth: c })
  const end = new Date().toISOString().split('T')[0]
  const start = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
  const base = { siteUrl: site.propertyUrl, requestBody: { startDate: start, endDate: end, rowLimit: 100 } }

  type Row = {
    keys?: string[] | null
    clicks?: number | null
    impressions?: number | null
    ctr?: number | null
    position?: number | null
  }

  const [daily, pages, kws, countries] = await Promise.all([
    sc.searchanalytics.query({ ...base, requestBody: { ...base.requestBody, dimensions: ['date'], rowLimit: 28 } }),
    sc.searchanalytics.query({ ...base, requestBody: { ...base.requestBody, dimensions: ['page'] } }),
    sc.searchanalytics.query({ ...base, requestBody: { ...base.requestBody, dimensions: ['query'] } }),
    sc.searchanalytics.query({ ...base, requestBody: { ...base.requestBody, dimensions: ['country'] } }),
  ])

  await db.$transaction([
    db.siteMetric.deleteMany({ where: { siteId } }),
    db.sitePage.deleteMany({ where: { siteId } }),
    db.siteKeyword.deleteMany({ where: { siteId } }),
    db.siteCountry.deleteMany({ where: { siteId } }),
    ...(daily.data.rows ?? []).map((r: Row) => db.siteMetric.create({ data: {
      siteId, date: new Date(r.keys![0]), clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0,
    }})),
    ...(pages.data.rows ?? []).map((r: Row) => db.sitePage.create({ data: {
      siteId, pageUrl: r.keys![0], clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0, ctr: (r.ctr ?? 0) * 100, position: r.position ?? 0,
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

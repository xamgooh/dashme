import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { db } from './db'

function createOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl() {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export async function listGscProperties(accessToken: string, refreshToken: string) {
  const client = createOAuthClient()
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

  const sc = google.searchconsole({ version: 'v1', auth: client })
  const { data } = await sc.sites.list()
  return data.siteEntry ?? []
}

async function getClientForSite(siteId: string) {
  const site = await db.site.findUniqueOrThrow({ where: { id: siteId } })
  const client = createOAuthClient()

  client.setCredentials({
    access_token: site.accessToken,
    refresh_token: site.refreshToken,
    expiry_date: site.tokenExpiry.getTime(),
  })

  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await db.site.update({
        where: { id: siteId },
        data: {
          accessToken: tokens.access_token,
          tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
        },
      })
    }
  })

  return { client, site }
}

function dateRange(days = 28) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export async function syncSite(siteId: string) {
  const { client, site } = await getClientForSite(siteId)
  const sc = google.searchconsole({ version: 'v1', auth: client })
  const { startDate, endDate } = dateRange(28)

  const base = {
    siteUrl: site.propertyUrl,
    requestBody: { startDate, endDate, rowLimit: 100 },
  }

  const [dailyRes, pagesRes, kwRes, countryRes] = await Promise.all([
    sc.searchanalytics.query({
      ...base,
      requestBody: { ...base.requestBody, dimensions: ['date'], rowLimit: 28 },
    }),
    sc.searchanalytics.query({
      ...base,
      requestBody: { ...base.requestBody, dimensions: ['page'] },
    }),
    sc.searchanalytics.query({
      ...base,
      requestBody: { ...base.requestBody, dimensions: ['query'] },
    }),
    sc.searchanalytics.query({
      ...base,
      requestBody: { ...base.requestBody, dimensions: ['country'] },
    }),
  ])

  type GscRow = { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }

  await db.$transaction([
    db.siteMetric.deleteMany({ where: { siteId } }),
    db.sitePage.deleteMany({ where: { siteId } }),
    db.siteKeyword.deleteMany({ where: { siteId } }),
    db.siteCountry.deleteMany({ where: { siteId } }),

    ...((dailyRes.data.rows ?? []).map((row: GscRow) =>
      db.siteMetric.create({
        data: {
          siteId,
          date: new Date(row.keys![0]),
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: (row.ctr ?? 0) * 100,
          position: row.position ?? 0,
        },
      })
    )),

    ...((pagesRes.data.rows ?? []).map((row: GscRow) =>
      db.sitePage.create({
        data: {
          siteId,
          pageUrl: row.keys![0],
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: (row.ctr ?? 0) * 100,
          position: row.position ?? 0,
        },
      })
    )),

    ...((kwRes.data.rows ?? []).map((row: GscRow) =>
      db.siteKeyword.create({
        data: {
          siteId,
          keyword: row.keys![0],
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: (row.ctr ?? 0) * 100,
          position: row.position ?? 0,
        },
      })
    )),

    ...((countryRes.data.rows ?? []).map((row: GscRow) =>
      db.siteCountry.create({
        data: {
          siteId,
          country: row.keys![0],
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: (row.ctr ?? 0) * 100,
          position: row.position ?? 0,
        },
      })
    )),

    db.site.update({
      where: { id: siteId },
      data: { lastSynced: new Date() },
    }),
  ])
}

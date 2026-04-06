export type DailyMetric = { date: string; clicks: number; impressions: number; ctr: number; position: number }
export type PageRow     = { pageUrl: string; clicks: number; impressions: number; ctr: number; position: number; trendPct: number }
export type KeywordRow  = { keyword: string; clicks: number; impressions: number; ctr: number; position: number }
export type CountryRow  = { country: string; clicks: number; impressions: number; ctr: number; position: number }
export type SiteWithData = {
  id: string; url: string; displayName: string | null; accountEmail: string | null
  active: boolean; color: string; lastSynced: string | null
  totals: { clicks: number; impressions: number; ctr: number; position: number; trend: number }
  metrics: DailyMetric[]; pages: PageRow[]; keywords: KeywordRow[]; countries: CountryRow[]
}

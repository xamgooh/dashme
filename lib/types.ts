export type SiteWithData = {
  id: string
  url: string
  displayName: string | null
  color: string
  lastSynced: string | null
  metrics: DailyMetric[]
  pages: PageRow[]
  keywords: KeywordRow[]
  countries: CountryRow[]
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    trend: number
  }
}

export type DailyMetric = {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type PageRow = {
  pageUrl: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type KeywordRow = {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type CountryRow = {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import SiteCard from './SiteCard'
import SiteCardLarge from './SiteCardLarge'
import AccountsView from './AccountsView'
import TagsView from './TagsView'
import { SiteWithData, DailyMetric, Account, Tag } from '@/lib/types'

const MainChart = dynamic(() => import('./charts/MainChart'), { ssr: false })

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

type View = 'overview' | 'sites' | 'countries' | 'pages' | 'accounts' | 'tags'
const PALETTE = ['#6366f1','#10b981','#ec4899','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4']

const s: Record<string, React.CSSProperties> = {
  wrap:     { background: '#f8f7f5', minHeight: '100vh', padding: '20px 24px', fontFamily: 'var(--font-sans, system-ui)' },
  tabBtn:   { padding: '5px 14px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#6b7280', transition: 'all 0.15s' },
  card:     { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px' },
  kpi:      { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' },
  kpiLbl:   { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 },
  kpiVal:   { fontSize: 28, fontWeight: 500, color: '#111', letterSpacing: '-0.5px', lineHeight: 1 },
  secLbl:   { fontSize: 12, fontWeight: 500, color: '#111', marginBottom: '0.75rem' },
}

export default function Dashboard() {
  const [view, setView]             = useState<View>('overview')
  const [allSites, setAllSites]     = useState<SiteWithData[]>([])
  const [accounts, setAccounts]     = useState<Account[]>([])
  const [tags, setTags]             = useState<Tag[]>([])
  const [overviewData, setOverview] = useState<{ totals: any; daily: DailyMetric[] } | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [syncing, setSyncing]       = useState<Record<string, boolean>>({})
  const [syncingAll, setSyncingAll] = useState(false)
  const [activeTag, setActiveTag]   = useState<string | null>(null)
  const [showAll, setShowAll]         = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [sr, or, ar, tr] = await Promise.all([fetch('/api/sites'), fetch('/api/overview'), fetch('/api/accounts'), fetch('/api/tags')])
      if (!sr.ok || !or.ok || !ar.ok || !tr.ok) throw new Error('API error')
      const [sj, oj, aj, tj] = await Promise.all([sr.json(), or.json(), ar.json(), tr.json()])
      setAllSites(sj); setOverview(oj); setAccounts(aj); setTags(tj)
    } catch (e: any) { setError(e.message ?? 'Fel') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const sites = useMemo(() => !activeTag ? allSites : allSites.filter(s => s.tags.some(t => t.id === activeTag)), [allSites, activeTag])

  const filteredDaily = useMemo(() => {
    if (!activeTag || !overviewData) return overviewData?.daily ?? []
    const byDate: Record<string, { clicks: number; impressions: number }> = {}
    sites.forEach(site => site.metrics.forEach(m => {
      if (!byDate[m.date]) byDate[m.date] = { clicks: 0, impressions: 0 }
      byDate[m.date].clicks += m.clicks; byDate[m.date].impressions += m.impressions
    }))
    return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v, ctr: 0, position: 0 }))
  }, [activeTag, overviewData, sites])

  async function handleSync(id: string) {
    setSyncing(p => ({ ...p, [id]: true }))
    await fetch(`/api/sites/${id}/sync`, { method: 'POST' })
    await loadData()
    setSyncing(p => ({ ...p, [id]: false }))
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    await Promise.all(sites.map(site => fetch(`/api/sites/${site.id}/sync`, { method: 'POST' })))
    await loadData()
    setSyncingAll(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sites/${id}`, { method: 'DELETE' })
    await loadData()
  }

  const totals   = overviewData?.totals
  const daily    = filteredDaily
  const trendUp  = (totals?.trend ?? 0) >= 0
  const connectUrl = `/api/auth/google?secret=${process.env.NEXT_PUBLIC_DASHBOARD_SECRET ?? ''}`

  const navTabs: { key: View; label: string }[] = [
    { key: 'overview',  label: 'Overview' },
    { key: 'sites',     label: 'Sites' },
    { key: 'countries', label: 'Countries' },
    { key: 'pages',     label: 'Pages' },
    { key: 'accounts',  label: `Accounts${accounts.length ? ` (${accounts.length})` : ''}` },
    { key: 'tags',      label: `Tags${tags.length ? ` (${tags.length})` : ''}` },
  ]

  if (loading) return <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#9ca3af', fontSize: 13 }}>Laddar...</div></div>

  if (error) return (
    <div style={{ ...s.wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ color: '#ef4444', fontSize: 14 }}>Fel vid laddning</div>
      <div style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace', background: '#fff', padding: '8px 16px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)' }}>{error}</div>
      <button onClick={loadData} style={{ padding: '6px 16px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}>Försök igen</button>
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 3 }}>iCyber AB</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#111', letterSpacing: '-0.3px' }}>Dashme</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#9ca3af', padding: '4px 10px', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 20 }}>Last 28 days</span>
          {navTabs.map(t => (
            <button key={t.key} onClick={() => setView(t.key)} style={{ ...s.tabBtn, ...(view === t.key ? { background: '#111', color: '#fff', borderColor: '#111' } : {}) }}>
              {t.label}
            </button>
          ))}
          <button onClick={handleSyncAll} disabled={syncingAll} style={{ ...s.tabBtn, color: syncingAll ? '#d1d5db' : '#6366f1', borderColor: 'rgba(99,102,241,0.3)' }}>
            {syncingAll ? 'Syncing…' : 'Sync all'}
          </button>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login' }} style={{ ...s.tabBtn, color: '#9ca3af' }}>
            Logga ut
          </button>
        </div>
      </div>

      {/* Tag filter bar */}
      {['overview','sites','countries','pages'].includes(view) && tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', marginRight: 2 }}>Filter:</span>
          <button
            onClick={() => setActiveTag(null)}
            style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${!activeTag ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)'}`, background: !activeTag ? '#111' : 'transparent', color: !activeTag ? '#fff' : '#6b7280', fontSize: 11, cursor: 'pointer' }}
          >
            All ({allSites.length})
          </button>
          {tags.map(tag => {
            const isActive = activeTag === tag.id
            const count = allSites.filter(s => s.tags.some(t => t.id === tag.id)).length
            return (
              <button key={tag.id} onClick={() => setActiveTag(isActive ? null : tag.id)}
                style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${isActive ? tag.color + '60' : 'rgba(0,0,0,0.08)'}`, background: isActive ? tag.color + '12' : 'transparent', color: isActive ? tag.color : '#6b7280', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: tag.color, display: 'inline-block' }} />
                {tag.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* OVERVIEW */}
      {view === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Total Clicks',  val: fmtN(totals?.clicks ?? 0) },
              { label: 'Impressions',   val: fmtN(totals?.impressions ?? 0) },
              { label: 'Avg. CTR',      val: `${totals?.ctr ?? 0}%` },
              { label: 'Avg. Position', val: String(totals?.position ?? 0) },
            ].map(({ label, val }) => (
              <div key={label} style={s.kpi}>
                <div style={s.kpiLbl}>{label}</div>
                <div style={s.kpiVal}>{val}</div>
                <div style={{ fontSize: 11, color: trendUp ? '#059669' : '#dc2626', marginTop: 6 }}>
                  {trendUp ? '+' : ''}{totals?.trend ?? 0}% vs prev period
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...s.card, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={s.secLbl}>Clicks & Impressions — 28 days</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#9ca3af' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />Clicks</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />Impressions ÷100</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              {daily.length > 0 ? <MainChart data={daily} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d1d5db', fontSize: 13 }}>Synca sajter för att se data</div>}
            </div>
          </div>

          {/* Site cards — sorted by clicks, 3 per row */}
          {(() => {
            const sorted = [...sites].sort((a, b) => b.totals.clicks - a.totals.clicks)
            const visible = showAll ? sorted : sorted.slice(0, 9)
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, marginBottom: 16 }}>
                  {visible.map(site => (
                    <SiteCardLarge key={site.id} site={site} onSync={handleSync} onDelete={handleDelete} syncing={!!syncing[site.id]} />
                  ))}
                </div>
                {sorted.length > 9 && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setShowAll(p => !p)}
                      style={{ padding: '8px 24px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}
                    >
                      {showAll ? `Visa färre` : `Visa alla ${sorted.length} sajter`}
                    </button>
                  </div>
                )}
                {sites.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#d1d5db', fontSize: 13 }}>
                    Inga aktiva sajter — gå till Accounts
                  </div>
                )}
              </>
            )
          })()}
        </>
      )}

      {/* SITES — 5 cols desktop, responsive */}
      {view === 'sites' && (
        <div className="sites-grid">
          {sites.map(site => (
            <SiteCard key={site.id} site={site} onSync={handleSync} onDelete={handleDelete} syncing={!!syncing[site.id]} />
          ))}
          {sites.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#d1d5db', fontSize: 13 }}>
              {activeTag ? `Inga sajter med den taggen` : 'Inga aktiva sajter — gå till Accounts'}
            </div>
          )}
          <a href={connectUrl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '0.5px dashed rgba(0,0,0,0.12)', borderRadius: 12, textDecoration: 'none', color: '#9ca3af', fontSize: 11, minHeight: 180, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Connect
          </a>
        </div>
      )}

      {/* COUNTRIES */}
      {view === 'countries' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={s.card}>
            <div style={s.secLbl}>Countries</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
                {['Country','Clicks','Impressions','CTR','Pos'].map((h,i) => (
                  <th key={h} style={{ textAlign: i===0?'left':'right', padding: '6px 0', fontWeight: 500, color: '#9ca3af', fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(() => {
                  const merged: Record<string,{clicks:number;impressions:number;ctr:number[];pos:number[]}> = {}
                  sites.flatMap(s => s.countries).forEach(c => {
                    if (!merged[c.country]) merged[c.country] = {clicks:0,impressions:0,ctr:[],pos:[]}
                    merged[c.country].clicks += c.clicks; merged[c.country].impressions += c.impressions
                    merged[c.country].ctr.push(c.ctr); merged[c.country].pos.push(c.position)
                  })
                  return Object.entries(merged).sort(([,a],[,b]) => b.clicks-a.clicks).map(([country,v]) => (
                    <tr key={country} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '8px 0', color: '#111' }}>{country}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500, color: '#111' }}>{fmtN(v.clicks)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280' }}>{fmtN(v.impressions)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280' }}>{(v.ctr.reduce((a,b)=>a+b,0)/v.ctr.length).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280' }}>{(v.pos.reduce((a,b)=>a+b,0)/v.pos.length).toFixed(1)}</td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
          <div style={s.card}>
            <div style={s.secLbl}>Distribution</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {(() => {
                const merged: Record<string,number> = {}
                sites.flatMap(s => s.countries).forEach(c => { merged[c.country] = (merged[c.country]??0)+c.clicks })
                const sorted = Object.entries(merged).sort(([,a],[,b]) => b-a).slice(0,7)
                const maxC = sorted[0]?.[1]??1
                return sorted.map(([country,clicks],i) => (
                  <div key={country} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#111', fontWeight: 500 }}>{country}</span>
                      <span style={{ color: '#9ca3af' }}>{fmtN(clicks)}</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
                      <div style={{ height: 3, width: `${Math.round((clicks/maxC)*100)}%`, background: PALETTE[i%PALETTE.length], borderRadius: 2 }} />
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* PAGES */}
      {view === 'pages' && (
        <div style={s.card}>
          <div style={s.secLbl}>Top pages — alla sajter</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              {['Page','Site','Clicks','Impr','CTR','Pos','Trend'].map((h,i) => (
                <th key={h} style={{ textAlign: i<2?'left':'right', padding: '6px 0', fontWeight: 500, color: '#9ca3af', fontSize: 11 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sites.flatMap(site => site.pages.map(p => ({ ...p, siteName: site.displayName??site.url, siteColor: site.color })))
                .sort((a,b) => b.clicks-a.clicks).slice(0,50)
                .map((p,i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '8px 0', color: '#374151', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {p.pageUrl.length>55 ? p.pageUrl.slice(0,55)+'…' : p.pageUrl}
                    </td>
                    <td style={{ padding: '8px 10px 8px 0' }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: p.siteColor+'15', color: p.siteColor }}>{p.siteName}</span>
                    </td>
                    <td style={{ textAlign:'right', padding:'8px 0', fontWeight:500, color:'#111' }}>{fmtN(p.clicks)}</td>
                    <td style={{ textAlign:'right', padding:'8px 0', color:'#6b7280' }}>{fmtN(p.impressions)}</td>
                    <td style={{ textAlign:'right', padding:'8px 0', color:'#6b7280' }}>{p.ctr}%</td>
                    <td style={{ textAlign:'right', padding:'8px 0', color:'#6b7280' }}>{p.position}</td>
                    <td style={{ textAlign:'right', padding:'8px 0', fontWeight:500, color: p.trendPct>0?'#059669':p.trendPct<0?'#dc2626':'#9ca3af' }}>
                      {p.trendPct>0?'+':''}{p.trendPct}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACCOUNTS */}
      {view === 'accounts' && <AccountsView accounts={accounts} onRefresh={loadData} connectUrl={connectUrl} />}

      {/* TAGS */}
      {view === 'tags' && <TagsView tags={tags} sites={allSites} onRefresh={loadData} />}
    </div>
  )
}

'use client'
import { useState } from 'react'
import SparkLine from './charts/SparkLine'
import { SiteWithData } from '@/lib/types'

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

function posBadge(pos: number): React.CSSProperties {
  if (pos <= 3)  return { background: '#f0fdf4', color: '#166534' }
  if (pos <= 10) return { background: '#eff6ff', color: '#1e40af' }
  return { background: '#f9fafb', color: '#6b7280' }
}

type Props = { site: SiteWithData; onSync: (id: string) => void; onDelete: (id: string) => void; syncing: boolean }

export default function SiteCardLarge({ site, onSync, onDelete, syncing }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { totals } = site
  const tUp = totals.trend >= 0
  const maxP = site.pages[0]?.clicks ?? 1
  const trending = site.pages.filter(p => p.trendPct > 10).sort((a, b) => b.trendPct - a.trendPct).slice(0, 5)

  return (
    <div
      style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.16)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)')}
    >
      <div style={{ height: 3, background: site.color }} />

      <div style={{ padding: '18px 20px 0' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: site.color, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {site.displayName ?? site.url}
            </div>
            {site.accountEmail && (
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{site.accountEmail}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: tUp ? '#059669' : '#dc2626' }}>
              {tUp ? '+' : ''}{totals.trend}%
            </div>
            <button
              onClick={() => onSync(site.id)}
              disabled={syncing}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.08)', background: 'transparent', color: syncing ? '#d1d5db' : '#9ca3af', cursor: syncing ? 'not-allowed' : 'pointer' }}
            >
              {syncing ? '…' : 'Sync'}
            </button>
          </div>
        </div>

        {/* Big number */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <div style={{ fontSize: 42, fontWeight: 500, color: '#111', letterSpacing: '-1px', lineHeight: 1 }}>
            {fmtN(totals.clicks)}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>clicks</div>
        </div>

        {/* Status dot + sync date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: site.lastSynced ? '#10b981' : '#d1d5db', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {site.lastSynced ? `Synced ${new Date(site.lastSynced).toLocaleDateString('sv-SE')}` : 'Not synced'}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ padding: '0 14px' }}>
        {site.metrics.length > 0
          ? <SparkLine data={site.metrics} color={site.color} height={70} />
          : <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 12 }}>Sync för att ladda data</div>
        }
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '14px 20px' }}>
        {[
          { label: 'Impressions', val: fmtN(totals.impressions) },
          { label: 'CTR',         val: `${totals.ctr}%` },
          { label: 'Avg position',val: String(totals.position) },
          { label: '28-day trend', val: `${tUp?'+':''}${totals.trend}%`, color: tUp?'#059669':'#dc2626' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#f8f7f5', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: color ?? '#111' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {site.tags.length > 0 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {site.tags.map(t => (
            <span key={t.id} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: t.color + '12', color: t.color, border: `0.5px solid ${t.color}40` }}>{t.name}</span>
          ))}
        </div>
      )}

      {/* More data button */}
      <div style={{ padding: '0 20px 16px', marginTop: 'auto' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '7px', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#9ca3af', transition: 'all 0.15s' }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            <path d="M2 4l3.5 3.5L9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? 'Less' : 'More data'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '16px 20px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Trending */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 8 }}>Trending pages</div>
            {trending.length === 0 && <div style={{ fontSize: 12, color: '#d1d5db' }}>Ingen positiv trend</div>}
            {trending.map(p => (
              <div key={p.pageUrl} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', minWidth: 40, flexShrink: 0 }}>+{Math.round(p.trendPct)}%</span>
                <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                  {p.pageUrl.length > 36 ? p.pageUrl.slice(0, 36) + '…' : p.pageUrl}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtN(p.clicks)}</span>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 8 }}>Keywords</div>
            {site.keywords.slice(0, 7).map(k => (
              <div key={k.keyword} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 11, padding: '1px 5px', borderRadius: 4, fontWeight: 500, flexShrink: 0, ...posBadge(k.position) }}>#{Math.round(k.position)}</span>
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.keyword}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtN(k.clicks)}</span>
              </div>
            ))}
          </div>

          {/* Top pages */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 8 }}>Top pages</div>
            {site.pages.slice(0, 6).map(p => {
              const pct = Math.round((p.clicks / maxP) * 100)
              return (
                <div key={p.pageUrl} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {p.pageUrl.length > 36 ? p.pageUrl.slice(0, 36) + '…' : p.pageUrl}
                    </span>
                    <span style={{ color: '#374151', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{fmtN(p.clicks)}</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
                    <div style={{ height: 2, width: `${pct}%`, background: site.color, borderRadius: 2, opacity: 0.5 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

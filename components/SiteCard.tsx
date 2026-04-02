'use client'

import { useState } from 'react'
import SparkLine from './charts/SparkLine'
import { SiteWithData } from '@/lib/types'

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

function posStyle(pos: number): React.CSSProperties {
  if (pos <= 3) return { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
  if (pos <= 10) return { background: 'rgba(129,140,248,0.12)', color: '#818cf8' }
  return { background: 'rgba(255,255,255,0.06)', color: '#50507a' }
}

type Props = {
  site: SiteWithData
  onSync: (id: string) => void
  onDelete: (id: string) => void
  syncing: boolean
}

export default function SiteCard({ site, onSync, onDelete, syncing }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { totals } = site
  const trendUp = totals.trend >= 0
  const maxPageClicks = site.pages[0]?.clicks ?? 1

  return (
    <div
      style={{
        background: '#131318',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '1.1rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: site.color,
          borderRadius: '12px 12px 0 0',
          opacity: 0.7,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f4' }}>
            {site.displayName ?? site.url}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: site.lastSynced ? '#34d399' : '#50507a', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#50507a' }}>
              {site.lastSynced
                ? `Synced ${new Date(site.lastSynced).toLocaleDateString('sv-SE')}`
                : 'Not synced'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: trendUp ? '#34d399' : '#f87171' }}>
            {trendUp ? '+' : ''}{totals.trend}%
          </span>
          <button
            onClick={() => onSync(site.id)}
            disabled={syncing}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: syncing ? '#50507a' : '#7070a0',
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            {syncing ? '…' : 'Sync'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { label: 'Clicks', value: fmtN(totals.clicks) },
          { label: 'Impr', value: fmtN(totals.impressions) },
          { label: 'CTR', value: `${totals.ctr}%` },
          { label: 'Pos', value: String(totals.position) },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#1a1a22', borderRadius: 8, padding: '7px 10px', flex: 1 }}>
            <div style={{ fontSize: 10, color: '#50507a', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f4' }}>{value}</div>
          </div>
        ))}
      </div>

      {site.metrics.length > 0 ? (
        <div style={{ margin: '0 -4px' }}>
          <SparkLine data={site.metrics} color={site.color} height={80} />
        </div>
      ) : (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#50507a', fontSize: 12 }}>
          No data — sync to load
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
          padding: '7px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 12,
          color: '#7070a0',
          marginTop: 12,
          transition: 'all 0.15s',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {expanded ? 'Less' : 'More data'}
      </button>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50507a', fontWeight: 500, marginBottom: 8 }}>
            Top pages
          </div>
          {site.pages.slice(0, 5).map((p) => {
            const pct = Math.round((p.clicks / maxPageClicks) * 100)
            const short = p.pageUrl.length > 38 ? p.pageUrl.slice(0, 38) + '…' : p.pageUrl
            return (
              <div key={p.pageUrl} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#7070a0', fontFamily: 'var(--font-mono)' }}>{short}</span>
                  <span style={{ color: '#c8c8e0', fontWeight: 500 }}>{fmtN(p.clicks)}</span>
                </div>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: 2, width: `${pct}%`, background: site.color, borderRadius: 2, opacity: 0.7 }} />
                </div>
              </div>
            )
          })}

          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50507a', fontWeight: 500, marginBottom: 8, marginTop: 14 }}>
            Keywords
          </div>
          {site.keywords.slice(0, 7).map((k) => (
            <div key={k.keyword} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'inline-block', minWidth: 28, textAlign: 'center', padding: '2px 5px', borderRadius: 5, fontSize: 10, fontWeight: 600, ...posStyle(k.position) }}>
                #{Math.round(k.position)}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: '#c8c8e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {k.keyword}
              </span>
              <span style={{ fontSize: 11, color: '#50507a' }}>{fmtN(k.clicks)}</span>
            </div>
          ))}

          <button
            onClick={() => { if (confirm(`Ta bort ${site.displayName ?? site.url}?`)) onDelete(site.id) }}
            style={{ marginTop: 14, fontSize: 11, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Ta bort sajt
          </button>
        </div>
      )}
    </div>
  )
}

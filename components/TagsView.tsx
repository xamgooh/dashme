'use client'

import { useState } from 'react'
import { Tag, SiteWithData } from '@/lib/types'

const TAG_COLORS = ['#818cf8','#34d399','#f472b6','#fb923c','#38bdf8','#a78bfa','#4ade80','#fbbf24','#f87171','#06b6d4']

type Props = {
  tags: Tag[]
  sites: SiteWithData[]
  onRefresh: () => void
}

export default function TagsView({ tags, sites, onRefresh }: Props) {
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState('#818cf8')
  const [busy, setBusy]           = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})

  async function createTag() {
    if (!newName.trim()) return
    setBusy(p => ({ ...p, create: true }))
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    setNewName(''); setCreating(false)
    await onRefresh()
    setBusy(p => ({ ...p, create: false }))
  }

  async function deleteTag(id: string) {
    if (!confirm('Ta bort taggen?')) return
    setBusy(p => ({ ...p, [id]: true }))
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    await onRefresh()
    setBusy(p => ({ ...p, [id]: false }))
  }

  async function renameTag(id: string) {
    if (!editName.trim()) return
    await fetch(`/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditingId(null)
    await onRefresh()
  }

  async function toggleSiteTag(tagId: string, siteId: string, hasTag: boolean) {
    setBusy(p => ({ ...p, [`${tagId}-${siteId}`]: true }))
    await fetch(`/api/tags/${tagId}/sites`, {
      method: hasTag ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
    })
    await onRefresh()
    setBusy(p => ({ ...p, [`${tagId}-${siteId}`]: false }))
  }

  const card: React.CSSProperties = {
    background: '#131318', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '1.25rem', marginBottom: 12,
  }

  return (
    <div>
      {/* Existing tags */}
      {tags.map(tag => {
        const tagSiteIds = new Set(tag.sites.map(s => s.id))
        const isExpanded = expanded[tag.id]

        return (
          <div key={tag.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: tag.color, flexShrink: 0 }} />
                {editingId === tag.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameTag(tag.id); if (e.key === 'Escape') setEditingId(null) }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '3px 8px', color: '#e8e8f4', fontSize: 13, width: 160, outline: 'none' }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f4', cursor: 'pointer' }}
                    onDoubleClick={() => { setEditingId(tag.id); setEditName(tag.name) }}
                    title="Dubbelklicka för att byta namn"
                  >
                    {tag.name}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#50507a', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 10 }}>
                  {tag.sites.length} {tag.sites.length === 1 ? 'sajt' : 'sajter'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingId === tag.id ? (
                  <>
                    <button onClick={() => renameTag(tag.id)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)', background: 'transparent', color: '#34d399', cursor: 'pointer' }}>Spara</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#7070a0', cursor: 'pointer' }}>Avbryt</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(p => ({ ...p, [tag.id]: !p[tag.id] }))}
                      style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#7070a0', cursor: 'pointer' }}
                    >
                      {isExpanded ? 'Stäng' : 'Hantera sajter'}
                    </button>
                    <button
                      onClick={() => { setEditingId(tag.id); setEditName(tag.name) }}
                      style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#50507a', cursor: 'pointer' }}
                    >
                      Byt namn
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      disabled={busy[tag.id]}
                      style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: '#f87171', cursor: 'pointer', opacity: busy[tag.id] ? 0.5 : 1 }}
                    >
                      Ta bort
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sites manager */}
            {isExpanded && (
              <div>
                <div style={{ fontSize: 11, color: '#50507a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  Välj sajter
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                  {sites.map(site => {
                    const has = tagSiteIds.has(site.id)
                    const key = `${tag.id}-${site.id}`
                    return (
                      <div
                        key={site.id}
                        onClick={() => !busy[key] && toggleSiteTag(tag.id, site.id, has)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                          borderRadius: 8, cursor: busy[key] ? 'not-allowed' : 'pointer',
                          border: has ? `1px solid ${tag.color}50` : '1px solid rgba(255,255,255,0.05)',
                          background: has ? `${tag.color}10` : 'transparent',
                          transition: 'all 0.15s', opacity: busy[key] ? 0.5 : 1,
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: site.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: has ? '#e8e8f4' : '#7070a0', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {site.displayName ?? site.url}
                        </span>
                        {site.accountEmail && (
                          <span style={{ fontSize: 10, color: '#50507a', whiteSpace: 'nowrap' }}>{site.accountEmail.split('@')[0]}</span>
                        )}
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${has ? tag.color : 'rgba(255,255,255,0.15)'}`, background: has ? tag.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {has && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {tags.length === 0 && !creating && (
        <div style={{ ...card, textAlign: 'center', padding: '2.5rem', color: '#50507a' }}>
          Inga taggar ännu — skapa din första nedan
        </div>
      )}

      {/* Create new tag */}
      {creating ? (
        <div style={card}>
          <div style={{ fontSize: 12, color: '#50507a', marginBottom: 12 }}>Ny tagg</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              autoFocus
              placeholder="Namn, t.ex. Betting"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') setCreating(false) }}
              style={{ background: '#0b0b0f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: '#e8e8f4', fontSize: 13, flex: 1, minWidth: 160, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {TAG_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{ width: 20, height: 20, borderRadius: 5, background: c, cursor: 'pointer', border: newColor === c ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.1s' }}
                />
              ))}
            </div>
            <button onClick={createTag} disabled={!newName.trim() || busy.create} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: busy.create ? 0.5 : 1 }}>
              {busy.create ? '…' : 'Skapa'}
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7070a0', fontSize: 13, cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, border: '1px dashed rgba(129,140,248,0.3)', background: 'transparent', color: '#818cf8', fontSize: 13, cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Skapa tagg
        </button>
      )}
    </div>
  )
}

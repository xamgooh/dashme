import { NextRequest } from 'next/server'
import { syncSite } from '@/lib/gsc'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await syncSite(params.id)
    return Response.json({ ok: true })
  } catch (err: any) {
    console.error('Sync error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

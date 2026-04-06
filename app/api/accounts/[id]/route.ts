import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// PATCH: toggle connected
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { connected } = await req.json()
  const account = await db.account.update({
    where: { id: params.id },
    data: { connected },
  })
  return Response.json({ ok: true, connected: account.connected })
}

// DELETE: remove account + all sites (cascade)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.account.delete({ where: { id: params.id } })
  return Response.json({ ok: true })
}

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, color } = await req.json()
  const tag = await db.tag.update({
    where: { id: params.id },
    data: { ...(name ? { name: name.trim() } : {}), ...(color ? { color } : {}) },
  })
  return Response.json({ ok: true, tag })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.tag.delete({ where: { id: params.id } })
  return Response.json({ ok: true })
}

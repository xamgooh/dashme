import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { active } = await req.json()
  await db.site.update({ where: { id: params.id }, data: { active } })
  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.site.delete({ where: { id: params.id } })
  return Response.json({ ok: true })
}

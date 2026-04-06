import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { siteId } = await req.json()
  await db.siteTag.upsert({
    where: { siteId_tagId: { siteId, tagId: params.id } },
    update: {},
    create: { siteId, tagId: params.id },
  })
  return Response.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { siteId } = await req.json()
  await db.siteTag.deleteMany({ where: { siteId, tagId: params.id } })
  return Response.json({ ok: true })
}

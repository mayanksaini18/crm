import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

const updateVisitSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional().nullable(),
  scheduledAt: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = updateVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const existing = await db.visit.findFirst({
    where: {
      id,
      ...(session!.user.role === 'AGENT' ? { agentId: session!.user.id } : {}),
    },
  })
  if (!existing) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  const data = parsed.data
  const visit = await db.visit.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
    },
    include: {
      lead: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
  })

  if (data.status && data.status !== existing.status) {
    const typeMap: Record<string, string> = {
      COMPLETED: 'VISIT_COMPLETED',
      NO_SHOW: 'NOTE',
      CANCELLED: 'NOTE',
    }
    const descMap: Record<string, string> = {
      COMPLETED: `Visit completed at ${existing.property}`,
      NO_SHOW: `Lead did not show up for visit at ${existing.property}`,
      CANCELLED: `Visit cancelled at ${existing.property}`,
    }
    await db.activity.create({
      data: {
        leadId: existing.leadId,
        userId: session!.user.id,
        type: typeMap[data.status] ?? 'NOTE',
        description: descMap[data.status] ?? `Visit status updated to ${data.status}`,
      },
    })

    if (data.status === 'COMPLETED') {
      const lead = await db.lead.findUnique({ where: { id: existing.leadId } })
      if (lead && lead.stage === 'VISIT_SCHEDULED') {
        await db.lead.update({ where: { id: existing.leadId }, data: { stage: 'VISITED' } })
        await db.activity.create({
          data: {
            leadId: existing.leadId,
            userId: session!.user.id,
            type: 'STAGE_CHANGE',
            description: 'Stage changed: VISIT_SCHEDULED → VISITED',
          },
        })
      }
    }
  }

  return NextResponse.json(visit)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const visit = await db.visit.findFirst({
    where: {
      id,
      ...(session!.user.role === 'AGENT' ? { agentId: session!.user.id } : {}),
    },
  })
  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  await db.visit.update({ where: { id }, data: { status: 'CANCELLED' } })
  await db.activity.create({
    data: {
      leadId: visit.leadId,
      userId: session!.user.id,
      type: 'NOTE',
      description: `Visit cancelled at ${visit.property}`,
    },
  })

  return NextResponse.json({ success: true })
}

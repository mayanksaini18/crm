import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

const createVisitSchema = z.object({
  leadId: z.string().min(1),
  property: z.string().min(1),
  scheduledAt: z.string(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const upcoming = searchParams.get('upcoming')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (session!.user.role === 'AGENT') where.agentId = session!.user.id

  if (status) {
    where.status = status
  } else if (upcoming === 'true') {
    where.scheduledAt = { gte: new Date() }
    where.status = 'SCHEDULED'
  } else if (upcoming === 'false') {
    where.OR = [
      { scheduledAt: { lt: new Date() } },
      { status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED'] } },
    ]
  }

  const visits = await db.visit.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, phone: true, stage: true } },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(visits)
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const parsed = createVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const { leadId, property, scheduledAt, notes } = parsed.data

  const lead = await db.lead.findFirst({ where: { id: leadId, deletedAt: null } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const visit = await db.visit.create({
    data: {
      leadId,
      agentId: session!.user.id,
      property,
      scheduledAt: new Date(scheduledAt),
      notes: notes ?? null,
      status: 'SCHEDULED',
    },
    include: {
      lead: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
  })

  // Auto-advance lead stage to VISIT_SCHEDULED if it's still in early stages
  if (['NEW', 'CONTACTED'].includes(lead.stage)) {
    await db.lead.update({ where: { id: leadId }, data: { stage: 'VISIT_SCHEDULED' } })
    await db.activity.create({
      data: {
        leadId,
        userId: session!.user.id,
        type: 'STAGE_CHANGE',
        description: `Stage changed: ${lead.stage} → VISIT_SCHEDULED`,
      },
    })
  }

  await db.activity.create({
    data: {
      leadId,
      userId: session!.user.id,
      type: 'VISIT_SCHEDULED',
      description: `Visit scheduled at ${property} on ${new Date(scheduledAt).toLocaleDateString('en-IN')}`,
    },
  })

  return NextResponse.json(visit, { status: 201 })
}

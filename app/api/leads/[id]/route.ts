import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/api-auth'

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional().nullable(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']).optional(),
  stage: z.enum(['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CONVERTED', 'LOST']).optional(),
  budget: z.number().int().positive().optional().nullable(),
  moveInDate: z.string().optional().nullable(),
  propertyType: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params

  const lead = await db.lead.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(session!.user.role === 'AGENT' ? { assignedTo: session!.user.id } : {}),
    },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      visits: {
        include: { agent: { select: { id: true, name: true } } },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  })

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = updateLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const existing = await db.lead.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(session!.user.role === 'AGENT' ? { assignedTo: session!.user.id } : {}),
    },
  })

  if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const data = { ...parsed.data }

  // Agents cannot reassign leads
  if (session!.user.role === 'AGENT') delete data.assignedTo

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...data }
  if (data.moveInDate !== undefined) {
    updateData.moveInDate = data.moveInDate ? new Date(data.moveInDate) : null
  }

  const lead = await db.lead.update({
    where: { id },
    data: updateData,
    include: { agent: { select: { id: true, name: true, email: true } } },
  })

  if (data.stage && data.stage !== existing.stage) {
    await db.activity.create({
      data: {
        leadId: id,
        userId: session!.user.id,
        type: 'STAGE_CHANGE',
        description: `Stage changed: ${existing.stage} → ${data.stage}`,
      },
    })
  }

  if (data.assignedTo && data.assignedTo !== existing.assignedTo) {
    const agent = await db.user.findUnique({ where: { id: data.assignedTo }, select: { name: true } })
    await db.activity.create({
      data: {
        leadId: id,
        userId: session!.user.id,
        type: 'ASSIGNED',
        description: `Lead reassigned to ${agent?.name ?? 'agent'}`,
      },
    })
  }

  return NextResponse.json(lead)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  await db.lead.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}

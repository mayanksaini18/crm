import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().nullable(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']),
  budget: z.number().int().positive().optional().nullable(),
  moveInDate: z.string().optional().nullable(),
  propertyType: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const source = searchParams.get('source')
  const agentId = searchParams.get('agentId')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deletedAt: null }

  if (session!.user.role === 'AGENT') {
    where.assignedTo = session!.user.id
  } else if (agentId) {
    where.assignedTo = agentId
  }

  if (stage) where.stage = stage
  if (source) where.source = source
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: { agent: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.lead.count({ where }),
  ])

  return NextResponse.json({ leads, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const parsed = createLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const assignedTo =
    session!.user.role === 'AGENT' ? session!.user.id : (data.assignedTo ?? session!.user.id)

  const lead = await db.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      source: data.source,
      budget: data.budget ?? null,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
      propertyType: data.propertyType ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
      assignedTo,
      stage: 'NEW',
    },
    include: { agent: { select: { id: true, name: true, email: true } } },
  })

  await db.activity.create({
    data: {
      leadId: lead.id,
      userId: session!.user.id,
      type: 'NOTE',
      description: `Lead created from ${data.source.toLowerCase().replace(/_/g, ' ')}`,
    },
  })

  if (assignedTo) {
    await db.activity.create({
      data: {
        leadId: lead.id,
        userId: session!.user.id,
        type: 'ASSIGNED',
        description: `Lead assigned to ${lead.agent?.name ?? 'agent'}`,
      },
    })
  }

  return NextResponse.json(lead, { status: 201 })
}

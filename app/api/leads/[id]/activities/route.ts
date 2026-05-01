import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

const schema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'STAGE_CHANGE', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'ASSIGNED']),
  description: z.string().min(1),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const lead = await db.lead.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(session!.user.role === 'AGENT' ? { assignedTo: session!.user.id } : {}),
    },
  })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const activity = await db.activity.create({
    data: {
      leadId: id,
      userId: session!.user.id,
      type: parsed.data.type,
      description: parsed.data.description,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(activity, { status: 201 })
}

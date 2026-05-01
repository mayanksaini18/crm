import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const isAgent = session!.user.role === 'AGENT'
  const agentFilter = isAgent ? { assignedTo: session!.user.id } : {}
  const baseWhere = { deletedAt: null, ...agentFilter }

  const [
    totalLeads,
    totalToday,
    totalThisWeek,
    totalThisMonth,
    converted,
    visitsThisWeek,
    stageGroups,
    sourceGroups,
    agentLeaderboard,
  ] = await Promise.all([
    db.lead.count({ where: baseWhere }),
    db.lead.count({ where: { ...baseWhere, createdAt: { gte: startOfToday } } }),
    db.lead.count({ where: { ...baseWhere, createdAt: { gte: startOfWeek } } }),
    db.lead.count({ where: { ...baseWhere, createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { ...baseWhere, stage: 'CONVERTED' } }),
    db.visit.count({
      where: {
        scheduledAt: { gte: startOfWeek },
        ...(isAgent ? { agentId: session!.user.id } : {}),
      },
    }),
    db.lead.groupBy({ by: ['stage'], where: baseWhere, _count: true }),
    db.lead.groupBy({ by: ['source'], where: baseWhere, _count: true }),
    isAgent
      ? []
      : db.user.findMany({
          where: { role: 'AGENT' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { leads: { where: { stage: 'CONVERTED', deletedAt: null } } } },
          },
          orderBy: { leads: { _count: 'desc' } },
          take: 10,
        }),
  ])

  const byStage = Object.fromEntries(stageGroups.map((g) => [g.stage, g._count]))
  const bySource = Object.fromEntries(sourceGroups.map((g) => [g.source, g._count]))

  const leaderboard = Array.isArray(agentLeaderboard)
    ? agentLeaderboard.map((u) => ({
        agent: { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt },
        converted: u._count.leads,
      }))
    : []

  const nonLost = totalLeads - (byStage['LOST'] ?? 0)
  const conversionRate = nonLost > 0 ? Math.round((converted / nonLost) * 100) : 0

  return NextResponse.json({
    totalLeads,
    totalToday,
    totalThisWeek,
    totalThisMonth,
    converted,
    conversionRate,
    visitsThisWeek,
    byStage,
    bySource,
    leaderboard,
  })
}

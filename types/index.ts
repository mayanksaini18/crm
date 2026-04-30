export type Role = 'ADMIN' | 'AGENT'

export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'WALK_IN' | 'PHONE' | 'SOCIAL_MEDIA' | 'OTHER'

export type PipelineStage =
  | 'NEW'
  | 'CONTACTED'
  | 'VISIT_SCHEDULED'
  | 'VISITED'
  | 'NEGOTIATING'
  | 'CONVERTED'
  | 'LOST'

export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type ActivityType = 'NOTE' | 'CALL' | 'STAGE_CHANGE' | 'VISIT_SCHEDULED' | 'ASSIGNED' | 'EMAIL'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string | null
  source: LeadSource
  stage: PipelineStage
  budget?: number | null
  moveInDate?: Date | null
  propertyType?: string | null
  location?: string | null
  notes?: string | null
  lostReason?: string | null
  assignedTo?: string | null
  agent?: User | null
  createdAt: Date
  updatedAt: Date
}

export interface Visit {
  id: string
  leadId: string
  lead?: Lead
  agentId: string
  agent?: User
  property: string
  scheduledAt: Date
  status: VisitStatus
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  leadId: string
  userId: string
  user?: User
  type: ActivityType
  description: string
  createdAt: Date
}

export interface DashboardStats {
  totalLeads: number
  totalToday: number
  totalThisWeek: number
  totalThisMonth: number
  converted: number
  conversionRate: number
  visitsThisWeek: number
  byStage: Record<PipelineStage, number>
  bySource: Record<LeadSource, number>
  leaderboard: Array<{ agent: User; converted: number }>
}

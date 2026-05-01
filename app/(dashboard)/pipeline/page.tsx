'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'

interface Lead {
  id: string; name: string; phone: string; source: string; stage: string
  agent: { name: string } | null
}

const STAGES = ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CONVERTED', 'LOST']
const STAGE_HEADER_COLORS: Record<string, string> = {
  NEW: 'bg-gray-500', CONTACTED: 'bg-blue-500', VISIT_SCHEDULED: 'bg-yellow-500',
  VISITED: 'bg-orange-500', NEGOTIATING: 'bg-purple-500', CONVERTED: 'bg-green-500', LOST: 'bg-red-500',
}
const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: 'bg-indigo-100 text-indigo-700', REFERRAL: 'bg-green-100 text-green-700',
  WALK_IN: 'bg-yellow-100 text-yellow-700', PHONE: 'bg-blue-100 text-blue-700',
  SOCIAL_MEDIA: 'bg-pink-100 text-pink-700', OTHER: 'bg-gray-100 text-gray-700',
}

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const router = useRouter()
  return (
    <div
      onClick={() => !isDragging && router.push(`/leads/${lead.id}`)}
      className={`bg-white rounded-lg border p-3 text-sm cursor-pointer shadow-sm hover:shadow-md transition-shadow select-none ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="font-medium truncate">{lead.name}</p>
      <p className="text-gray-400 text-xs">{lead.phone}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[lead.source] ?? 'bg-gray-100 text-gray-600'}`}>
          {lead.source.replace(/_/g, ' ')}
        </span>
        {lead.agent && (
          <span className="text-xs text-gray-400">{lead.agent.name.split(' ')[0]}</span>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, data: { lead } })
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)`, zIndex: 50 } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({ stage, leads }: { stage: string; leads: Lead[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })
  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      <div className={`${STAGE_HEADER_COLORS[stage]} text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg flex justify-between`}>
        <span>{stage.replace(/_/g, ' ')}</span>
        <span>{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-32 p-2 space-y-2 rounded-b-lg border-x border-b transition-colors ${isOver ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
      >
        {leads.map((lead) => <DraggableCard key={lead.id} lead={lead} />)}
        {leads.length === 0 && <p className="text-center text-xs text-gray-300 py-6">Drop here</p>}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    fetch('/api/leads?limit=200')
      .then((r) => r.json())
      .then((d) => { setLeads(d.leads ?? []); setLoading(false) })
  }, [])

  const activeLead = leads.find((l) => l.id === activeId)

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const targetStage = STAGES.includes(String(over.id)) ? String(over.id) : null
    if (!targetStage) return

    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.stage === targetStage) return

    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === active.id ? { ...l, stage: targetStage } : l))

    await fetch(`/api/leads/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStage }),
    })
  }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <p className="text-gray-400 text-sm animate-pulse">Loading leads...</p>
    </div>
  )

  const byStage = STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.stage === s)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <div className="overflow-x-auto pb-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn key={stage} stage={stage} leads={byStage[stage] ?? []} />
            ))}
          </div>
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

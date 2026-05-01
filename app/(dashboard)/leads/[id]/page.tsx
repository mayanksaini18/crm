'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Phone, Mail, MapPin, Home, DollarSign } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Activity { id: string; type: string; description: string; createdAt: string; user: { name: string } }
interface Visit { id: string; property: string; scheduledAt: string; status: string; agent: { name: string } }
interface Lead {
  id: string; name: string; phone: string; email: string | null; source: string; stage: string
  budget: number | null; moveInDate: string | null; propertyType: string | null; location: string | null
  notes: string | null; lostReason: string | null; createdAt: string
  agent: { id: string; name: string } | null
  activities: Activity[]
  visits: Visit[]
}

const STAGES = ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CONVERTED', 'LOST']
const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-gray-200', CONTACTED: 'bg-blue-200', VISIT_SCHEDULED: 'bg-yellow-200',
  VISITED: 'bg-orange-200', NEGOTIATING: 'bg-purple-200', CONVERTED: 'bg-green-200', LOST: 'bg-red-200',
}
const ACTIVITY_ICONS: Record<string, string> = {
  NOTE: '📝', CALL: '📞', EMAIL: '✉️', STAGE_CHANGE: '🔄', VISIT_SCHEDULED: '📅',
  VISIT_COMPLETED: '✅', ASSIGNED: '👤',
}

function ScheduleVisitModal({ leadId, onClose, onScheduled }: { leadId: string; onClose: () => void; onScheduled: () => void }) {
  const [property, setProperty] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!property || !scheduledAt) { setError('Property and date are required'); return }
    setLoading(true)
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, property, scheduledAt: new Date(scheduledAt).toISOString(), notes: notes || null }),
    })
    setLoading(false)
    if (!res.ok) { setError('Failed to schedule visit'); return }
    onScheduled()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Schedule Visit</h2>
        <div className="space-y-3">
          <div><label className="text-sm font-medium">Property *</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={property} onChange={(e) => setProperty(e.target.value)} placeholder="Sunshine PG - Koramangala" /></div>
          <div><label className="text-sm font-medium">Date & Time *</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
          <div><label className="text-sm font-medium">Notes</label>
            <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</Button>
        </div>
      </div>
    </div>
  )
}

function AddNoteModal({ leadId, onClose, onAdded }: { leadId: string; onClose: () => void; onAdded: () => void }) {
  const [text, setText] = useState('')
  const [type, setType] = useState<'NOTE' | 'CALL'>('NOTE')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!text.trim()) return
    setLoading(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    // Log activity via a note patch — we'll post directly to activity endpoint
    await fetch('/api/leads/' + leadId + '/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description: text }),
    }).catch(() => null)
    setLoading(false)
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Add Note</h2>
        <div className="flex gap-2">
          {(['NOTE', 'CALL'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`px-3 py-1 rounded-full text-xs font-medium border ${type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}>{t}</button>
          ))}
        </div>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm resize-none" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note..." />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !text.trim()}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  )
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [visitModal, setVisitModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)

  const fetchLead = async () => {
    const res = await fetch(`/api/leads/${id}`)
    if (!res.ok) { router.push('/leads'); return }
    setLead(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchLead() }, [id])

  const updateStage = async (stage: string) => {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    fetchLead()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>
  if (!lead) return null

  const stageIdx = STAGES.indexOf(lead.stage)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {visitModal && <ScheduleVisitModal leadId={id} onClose={() => setVisitModal(false)} onScheduled={fetchLead} />}
      {noteModal && <AddNoteModal leadId={id} onClose={() => setNoteModal(false)} onAdded={fetchLead} />}

      <div className="flex items-center gap-3">
        <Link href="/leads" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}><ArrowLeft size={16} />Leads</Link>
        <h1 className="text-xl font-bold">{lead.name}</h1>
      </div>

      {/* Stage progression */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGES.filter((s) => s !== 'LOST').map((s, i) => {
          const past = stageIdx > i && lead.stage !== 'LOST'
          const active = lead.stage === s
          return (
            <button
              key={s}
              onClick={() => updateStage(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : past ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          )
        })}
        <button
          onClick={() => updateStage('LOST')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${lead.stage === 'LOST' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
        >
          Lost
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Contact Info</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setNoteModal(true)}>Add Note</Button>
                <Button size="sm" onClick={() => setVisitModal(true)}><Calendar size={14} className="mr-1" />Schedule Visit</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700"><Phone size={14} />{lead.phone}</div>
              {lead.email && <div className="flex items-center gap-2 text-gray-700"><Mail size={14} />{lead.email}</div>}
              {lead.location && <div className="flex items-center gap-2 text-gray-700"><MapPin size={14} />{lead.location}</div>}
              {lead.propertyType && <div className="flex items-center gap-2 text-gray-700"><Home size={14} />{lead.propertyType}</div>}
              {lead.budget && <div className="flex items-center gap-2 text-gray-700"><DollarSign size={14} />₹{lead.budget.toLocaleString('en-IN')}/month</div>}
              {lead.moveInDate && <div className="flex items-center gap-2 text-gray-700"><Calendar size={14} />Move-in: {new Date(lead.moveInDate).toLocaleDateString('en-IN')}</div>}
              {lead.notes && <p className="text-gray-500 mt-2 border-t pt-2">{lead.notes}</p>}
            </CardContent>
          </Card>

          {/* Visits */}
          {lead.visits.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Visits</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lead.visits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium">{v.property}</p>
                      <p className="text-gray-400 text-xs">{new Date(v.scheduledAt).toLocaleString('en-IN')} · {v.agent.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : v.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : v.status === 'NO_SHOW' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {lead.activities.map((a) => (
                    <div key={a.id} className="flex gap-3 text-sm">
                      <span className="text-base">{ACTIVITY_ICONS[a.type] ?? '•'}</span>
                      <div>
                        <p className="text-gray-700">{a.description}</p>
                        <p className="text-xs text-gray-400">{a.user.name} · {new Date(a.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Stage</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? ''}`}>{lead.stage.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Source</span><span>{lead.source.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Agent</span><span>{lead.agent?.name ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(lead.createdAt).toLocaleDateString('en-IN')}</span></div>
              {lead.lostReason && <div className="pt-2 border-t"><p className="text-gray-500 text-xs">Lost reason:</p><p className="text-gray-700">{lead.lostReason}</p></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

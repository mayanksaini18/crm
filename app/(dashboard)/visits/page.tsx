'use client'

import { useEffect, useState } from 'react'
import { Plus, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

interface Visit {
  id: string
  property: string
  scheduledAt: string
  status: string
  notes: string | null
  lead: { id: string; name: string; phone: string }
  agent: { id: string; name: string }
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function ScheduleModal({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => void }) {
  const [leadSearch, setLeadSearch] = useState('')
  const [leads, setLeads] = useState<{ id: string; name: string; phone: string }[]>([])
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(null)
  const [property, setProperty] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadSearch || leadSearch.length < 2) { setLeads([]); return }
    const timer = setTimeout(() => {
      fetch(`/api/leads?search=${encodeURIComponent(leadSearch)}&limit=5`)
        .then((r) => r.json())
        .then((d) => setLeads(d.leads ?? []))
    }, 300)
    return () => clearTimeout(timer)
  }, [leadSearch])

  const submit = async () => {
    if (!selectedLead || !property || !scheduledAt) { setError('Lead, property, and date are required'); return }
    setLoading(true)
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selectedLead.id, property, scheduledAt: new Date(scheduledAt).toISOString(), notes: notes || null }),
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
          <div>
            <label className="text-sm font-medium">Lead *</label>
            {selectedLead ? (
              <div className="mt-1 flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <span>{selectedLead.name}</span>
                <button onClick={() => { setSelectedLead(null); setLeadSearch('') }} className="text-gray-400 hover:text-gray-600 text-xs">Change</button>
              </div>
            ) : (
              <div className="relative mt-1">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Search by name or phone..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                />
                {leads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-md shadow-lg mt-1">
                    {leads.map((l) => (
                      <button key={l.id} onClick={() => { setSelectedLead(l); setLeads([]); setLeadSearch('') }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        <span className="font-medium">{l.name}</span>
                        <span className="text-gray-400 ml-2">{l.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Property *</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={property} onChange={(e) => setProperty(e.target.value)} placeholder="Sunshine PG - Koramangala" />
          </div>
          <div>
            <label className="text-sm font-medium">Date & Time *</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-sm resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
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

function VisitCard({ visit, onUpdate }: { visit: Visit; onUpdate: () => void }) {
  const updateStatus = async (status: string) => {
    await fetch(`/api/visits/${visit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{visit.lead.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[visit.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {visit.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{visit.property}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(visit.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {visit.agent.name}
            </p>
            {visit.notes && <p className="text-xs text-gray-500 mt-1 italic">{visit.notes}</p>}
          </div>
          {visit.status === 'SCHEDULED' && (
            <div className="flex flex-col gap-1.5">
              <button onClick={() => updateStatus('COMPLETED')} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900">
                <CheckCircle size={13} />Done
              </button>
              <button onClick={() => updateStatus('NO_SHOW')} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800">
                <AlertCircle size={13} />No Show
              </button>
              <button onClick={() => updateStatus('CANCELLED')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <XCircle size={13} />Cancel
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function VisitsPage() {
  const [upcoming, setUpcoming] = useState<Visit[]>([])
  const [past, setPast] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  const fetchVisits = async () => {
    const [u, p] = await Promise.all([
      fetch('/api/visits?upcoming=true').then((r) => r.json()),
      fetch('/api/visits?upcoming=false').then((r) => r.json()),
    ])
    setUpcoming(Array.isArray(u) ? u : [])
    setPast(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  useEffect(() => { fetchVisits() }, [])

  return (
    <div className="space-y-4">
      {modal && <ScheduleModal onClose={() => setModal(false)} onScheduled={fetchVisits} />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visits</h1>
        <Button onClick={() => setModal(true)}><Plus size={16} className="mr-2" />Schedule Visit</Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-lg bg-gray-200 animate-pulse" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">No upcoming visits.</p>
              <Button className="mt-4" onClick={() => setModal(true)}>Schedule one</Button>
            </div>
          ) : (
            <div className="space-y-3">{upcoming.map((v) => <VisitCard key={v.id} visit={v} onUpdate={fetchVisits} />)}</div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No past visits.</p>
          ) : (
            <div className="space-y-3">{past.map((v) => <VisitCard key={v.id} visit={v} onUpdate={fetchVisits} />)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

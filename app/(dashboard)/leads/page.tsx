'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  stage: string
  budget: number | null
  location: string | null
  createdAt: string
  agent: { id: string; name: string } | null
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  VISIT_SCHEDULED: 'bg-yellow-100 text-yellow-700',
  VISITED: 'bg-orange-100 text-orange-700',
  NEGOTIATING: 'bg-purple-100 text-purple-700',
  CONVERTED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
}

const STAGES = ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CONVERTED', 'LOST']
const SOURCES = ['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [source, setSource] = useState('all')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15' })
    if (search) params.set('search', search)
    if (stage !== 'all') params.set('stage', stage)
    if (source !== 'all') params.set('source', source)

    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(data.leads ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, search, stage, source])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useEffect(() => { setPage(1) }, [search, stage, source])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-gray-500">{total} total leads</p>
        </div>
        <Link href="/leads/new" className={buttonVariants({ variant: 'default' })}>
          <Plus size={16} className="mr-2" />New Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search name, phone, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stage} onValueChange={(v) => setStage(v ?? 'all')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={(v) => setSource(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 border-b animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No leads found. Try adjusting your filters.</p>
            <Link href="/leads/new" className={buttonVariants({ variant: 'outline' }) + ' mt-4 inline-flex'}>
              Add your first lead
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Phone', 'Stage', 'Source', 'Agent', 'Budget', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                      {lead.stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{lead.source.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.agent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.budget ? `₹${lead.budget.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === pages}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

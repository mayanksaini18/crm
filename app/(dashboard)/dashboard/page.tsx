'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Users, TrendingUp, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardData {
  totalLeads: number
  totalToday: number
  totalThisWeek: number
  totalThisMonth: number
  converted: number
  conversionRate: number
  visitsThisWeek: number
  byStage: Record<string, number>
  bySource: Record<string, number>
  leaderboard: Array<{ agent: { id: string; name: string }; converted: number }>
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', VISIT_SCHEDULED: 'Visit Sched.',
  VISITED: 'Visited', NEGOTIATING: 'Negotiating', CONVERTED: 'Converted', LOST: 'Lost',
}
const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>

  const stageChartData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    name: label,
    count: data.byStage[key] ?? 0,
  }))

  const sourceChartData = Object.entries(data.bySource).map(([source, count]) => ({
    name: source.replace(/_/g, ' '),
    value: count,
  }))

  const kpis = [
    { label: 'Total Leads', value: data.totalLeads, sub: `${data.totalToday} today`, icon: Users, color: 'text-indigo-600' },
    { label: 'Converted', value: data.converted, sub: `${data.conversionRate}% rate`, icon: Target, color: 'text-green-600' },
    { label: 'This Week', value: data.totalThisWeek, sub: 'new leads', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Visits This Week', value: data.visitsThisWeek, sub: 'scheduled', icon: Calendar, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <Icon size={22} className={color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Leads by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
          <CardContent>
            {sourceChartData.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {sourceChartData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {data.leaderboard.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Agent Leaderboard</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 font-medium text-right">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((row, i) => (
                  <tr key={row.agent.id} className="border-b last:border-0">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium">{row.agent.name}</td>
                    <td className="py-2 text-right font-semibold text-indigo-600">{row.converted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

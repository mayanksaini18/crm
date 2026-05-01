'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AgentUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: { leads: number }
}

function AddAgentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name || !email || !password) { setError('All fields are required'); return }
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'AGENT' }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Failed to create agent')
      return
    }
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Add Agent</h2>
        <div className="space-y-3">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@gharpayy.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Adding...' : 'Add Agent'}</Button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<AgentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (session?.user?.role === 'ADMIN') fetchUsers() }, [session])

  if (status === 'loading' || loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Team</h1>
      <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-gray-200 animate-pulse" />)}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {modal && <AddAgentModal onClose={() => setModal(false)} onAdded={fetchUsers} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-gray-500">{users.length} members</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} className="mr-2" />Add Agent</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {u.role === 'ADMIN'
                    ? <Shield size={18} className="text-indigo-600" />
                    : <User size={18} className="text-indigo-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{u.name}</p>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs h-4 px-1.5">
                      {u.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{u._count.leads} leads assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-16 text-center">
          <User size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No team members yet.</p>
          <Button className="mt-4" onClick={() => setModal(true)}>Add first agent</Button>
        </div>
      )}
    </div>
  )
}

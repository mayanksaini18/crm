'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']),
  budget: z.string().optional(),
  moveInDate: z.string().optional(),
  propertyType: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SOURCES = ['WEBSITE', 'REFERRAL', 'WALK_IN', 'PHONE', 'SOCIAL_MEDIA', 'OTHER']
const PROPERTY_TYPES = ['Single Room', 'Double Sharing', 'Triple Sharing', '1BHK', '2BHK']

export default function NewLeadPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { source: 'WEBSITE' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      source: data.source,
      budget: data.budget ? parseInt(data.budget) : null,
      moveInDate: data.moveInDate ? new Date(data.moveInDate).toISOString() : null,
      propertyType: data.propertyType || null,
      location: data.location || null,
      notes: data.notes || null,
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      setServerError(err.error ?? 'Failed to create lead')
      return
    }

    const lead = await res.json()
    router.push(`/leads/${lead.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/leads" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}>
          <ArrowLeft size={16} />Back
        </Link>
        <h1 className="text-xl font-bold">New Lead</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lead Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} placeholder="Amit Kumar" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone')} placeholder="9876543210" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="amit@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Source *</Label>
                <Select defaultValue="WEBSITE" onValueChange={(v) => setValue('source', (v ?? 'WEBSITE') as FormData['source'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="budget">Budget (₹/month)</Label>
                <Input id="budget" type="number" {...register('budget')} placeholder="8000" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="moveInDate">Move-in Date</Label>
                <Input id="moveInDate" type="date" {...register('moveInDate')} />
              </div>
              <div className="space-y-1">
                <Label>Property Type</Label>
                <Select onValueChange={(v) => { if (typeof v === 'string' && v) setValue('propertyType', v) }}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Preferred Location</Label>
                <Input id="location" {...register('location')} placeholder="Koramangala, Bangalore" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                placeholder="Any additional notes about this lead..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Lead'}
              </Button>
              <Link href="/leads" className={buttonVariants({ variant: 'outline' })}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

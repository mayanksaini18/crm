import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

type AuthResult =
  | { error: NextResponse; session: null }
  | { error: null; session: Session }

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result
  if (result.session.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  }
  return result
}

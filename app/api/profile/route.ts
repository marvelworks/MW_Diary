import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { name?: string }
  const nextName = body.name?.trim()

  if (!nextName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const previousName = currentUser.name

  const { error: userError } = await getSupabaseAdmin()
    .from('users')
    .update({ name: nextName })
    .eq('line_user_id', currentUser.lineUserId)

  if (userError) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }

  await Promise.all([
    getSupabaseAdmin().from('entries').update({ author_name: nextName }).eq('author_name', previousName),
    getSupabaseAdmin().from('likes').update({ user_name: nextName }).eq('user_name', previousName),
  ])

  return NextResponse.json({ ok: true, name: nextName })
}

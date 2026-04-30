import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type LikeRow = {
  id: string
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { entryId?: string; emoji?: string }
  const entryId = body.entryId
  const emoji = body.emoji?.trim()

  if (!entryId || !emoji) {
    return NextResponse.json({ error: 'entryId and emoji are required' }, { status: 400 })
  }

  const { data } = await getSupabaseAdmin()
    .from('likes')
    .select('id')
    .eq('entry_id', entryId)
    .eq('user_name', currentUser.name)
    .eq('emoji', emoji)
    .maybeSingle()

  const existing = data as LikeRow | null

  if (existing) {
    const { error } = await getSupabaseAdmin().from('likes').delete().eq('id', existing.id)
    if (error) {
      return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, liked: false })
  }

  const { error } = await getSupabaseAdmin().from('likes').insert({
    entry_id: entryId,
    user_name: currentUser.name,
    emoji,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to add like' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, liked: true })
}

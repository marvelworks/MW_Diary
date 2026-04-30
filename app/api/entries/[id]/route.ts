import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as { title?: string; body?: string }
  const nextBody = body.body?.trim()

  if (!nextBody) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('entries')
    .update({
      title: body.title?.trim() || null,
      body: nextBody,
    })
    .eq('id', id)
    .eq('author_name', currentUser.name)

  if (error) {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await getSupabaseAdmin()
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('author_name', currentUser.name)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

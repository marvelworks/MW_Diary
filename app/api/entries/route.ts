import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { pushLineMessage } from '@/lib/line'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type UserNotificationRow = {
  line_user_id: string
  notifications_enabled: boolean | null
  line_friendship_status: string | null
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    title?: string
    body?: string
    imageUrl?: string | null
  }

  const entryBody = body.body?.trim()
  if (!entryBody) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 })
  }

  const title = body.title?.trim() || null
  const imageUrl = body.imageUrl ?? null

  const { error } = await getSupabaseAdmin().from('entries').insert({
    author_name: currentUser.name,
    title,
    body: entryBody,
    image_url: imageUrl,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }

  const { data: users } = await getSupabaseAdmin()
    .from('users')
    .select('line_user_id, notifications_enabled, line_friendship_status')
    .neq('line_user_id', currentUser.lineUserId)
    .returns<UserNotificationRow[]>()

  const preview = title ?? `${entryBody.slice(0, 50)}${entryBody.length > 50 ? '…' : ''}`

  await Promise.all(
    (users ?? [])
      .filter(
        (user) =>
          user.notifications_enabled &&
          user.line_friendship_status === 'friend' &&
          user.line_user_id
      )
      .map((user) =>
        pushLineMessage(
          user.line_user_id,
          `${currentUser.name}さんが日記を投稿しました\n${preview}\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}`
        )
      )
  )

  return NextResponse.json({ ok: true })
}

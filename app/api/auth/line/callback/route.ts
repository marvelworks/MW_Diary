import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSession } from '@/lib/session'
import { exchangeLineCode, getLineFriendship, getLineProfile } from '@/lib/line'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type UserUpsertPayload = {
  line_user_id: string
  name: string
  avatar_url: string | null
  line_friendship_status: 'friend' | 'not_friend'
  notifications_enabled: boolean
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/?error=line_login_failed', request.url))
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('line_login_state')?.value
  cookieStore.delete('line_login_state')

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/?error=line_login_state', request.url))
  }

  const tokenData = await exchangeLineCode(code)
  const [profile, isFriend] = await Promise.all([
    getLineProfile(tokenData.access_token),
    getLineFriendship(tokenData.access_token),
  ])

  const usersTable = getSupabaseAdmin().from('users') as unknown as {
    upsert: (
      values: UserUpsertPayload,
      options?: { onConflict?: string }
    ) => Promise<unknown>
  }

  await usersTable.upsert(
    {
      line_user_id: profile.userId,
      name: profile.displayName,
      avatar_url: profile.pictureUrl ?? null,
      line_friendship_status: isFriend ? 'friend' : 'not_friend',
      notifications_enabled: isFriend,
    },
    { onConflict: 'line_user_id' }
  )

  await createSession(profile.userId)

  return NextResponse.redirect(new URL('/', request.url))
}

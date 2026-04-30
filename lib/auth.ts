import { cache } from 'react'
import { getSessionLineUserId } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type CurrentUser = {
  lineUserId: string
  name: string
  avatarUrl: string | null
  friendshipStatus: 'friend' | 'not_friend'
}

type UserRow = {
  line_user_id: string
  name: string
  avatar_url: string | null
  line_friendship_status: string | null
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const lineUserId = await getSessionLineUserId()
  if (!lineUserId) return null

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('line_user_id, name, avatar_url, line_friendship_status')
    .eq('line_user_id', lineUserId)
    .maybeSingle()

  const user = data as UserRow | null

  if (error || !user) {
    return null
  }

  return {
    lineUserId: user.line_user_id,
    name: user.name,
    avatarUrl: user.avatar_url,
    friendshipStatus: user.line_friendship_status === 'friend' ? 'friend' : 'not_friend',
  }
})

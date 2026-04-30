import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getLineLoginUrl } from '@/lib/line'

export async function GET() {
  const { state, url } = getLineLoginUrl()
  const cookieStore = await cookies()

  cookieStore.set('line_login_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  return NextResponse.redirect(url)
}

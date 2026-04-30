import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_COOKIE_NAME = 'korikan_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30

type SessionPayload = {
  lineUserId: string
  exp: number
}

function requireSecret() {
  const secret = process.env.LINE_SESSION_SECRET
  if (!secret) {
    throw new Error('Missing environment variable: LINE_SESSION_SECRET')
  }
  return secret
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(value: string) {
  return createHmac('sha256', requireSecret()).update(value).digest('base64url')
}

function encode(payload: SessionPayload) {
  const body = toBase64Url(JSON.stringify(payload))
  const signature = sign(body)
  return `${body}.${signature}`
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = sign(body)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  const payload = JSON.parse(fromBase64Url(body)) as SessionPayload
  if (payload.exp <= Date.now()) {
    return null
  }

  return payload
}

export async function createSession(lineUserId: string) {
  const token = encode({
    lineUserId,
    exp: Date.now() + SESSION_DURATION_MS,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionLineUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const payload = decode(token)
  return payload?.lineUserId ?? null
}

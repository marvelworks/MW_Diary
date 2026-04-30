const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile'
const LINE_FRIENDSHIP_URL = 'https://api.line.me/friendship/v1/status'
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push'

export type LineProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function getLineLoginUrl() {
  const channelId = requireEnv('LINE_CHANNEL_ID')
  const redirectUri = requireEnv('LINE_REDIRECT_URI')
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile',
    bot_prompt: 'normal',
  })

  return {
    state,
    url: `${LINE_AUTHORIZE_URL}?${params.toString()}`,
  }
}

export async function exchangeLineCode(code: string) {
  const channelId = requireEnv('LINE_CHANNEL_ID')
  const channelSecret = requireEnv('LINE_CHANNEL_SECRET')
  const redirectUri = requireEnv('LINE_REDIRECT_URI')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  })

  const response = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange LINE code: ${response.status}`)
  }

  return response.json() as Promise<{ access_token: string; id_token: string }>
}

export async function getLineProfile(accessToken: string) {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch LINE profile: ${response.status}`)
  }

  return response.json() as Promise<LineProfile>
}

export async function getLineFriendship(accessToken: string) {
  const response = await fetch(LINE_FRIENDSHIP_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return false
  }

  const data = (await response.json()) as { friendFlag?: boolean }
  return Boolean(data.friendFlag)
}

export async function pushLineMessage(userId: string, text: string) {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    return
  }

  await fetch(LINE_PUSH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text }],
    }),
  })
}

import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'ajax_session'
const SESSION_DURATION = '30d'

export interface SessionPayload {
  userId: number
  name: string
  role: 'ADMIN' | 'CHILD' | 'FRIEND'
  displayName: string
  [key: string]: unknown
}

function getSecretKey(event: H3Event) {
  const config = useRuntimeConfig(event)
  return new TextEncoder().encode(config.jwtSecret)
}

export async function createSessionToken(event: H3Event, payload: SessionPayload) {
  const secret = getSecretKey(event)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret)
}

export async function setSessionCookie(event: H3Event, payload: SessionPayload) {
  const token = await createSessionToken(event, payload)
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function getSession(event: H3Event): Promise<SessionPayload | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  try {
    const secret = getSecretKey(event)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function requireSession(event: H3Event): Promise<SessionPayload> {
  const session = await getSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Niet ingelogd' })
  }
  return session
}

export async function requireAdmin(event: H3Event): Promise<SessionPayload> {
  const session = await requireSession(event)
  if (session.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Alleen voor admins' })
  }
  return session
}

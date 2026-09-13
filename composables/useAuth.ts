import type { SessionInfo } from '~/types'

export function useAuth() {
  const session = useState<SessionInfo | null>('auth-session', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)

  async function fetchSession() {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const { session: s } = await $fetch<{ session: SessionInfo | null }>('/api/auth/me', { headers })
    session.value = s
    initialized.value = true
    return s
  }

  async function login(userId: number, pin: string, displayName?: string) {
    const result = await $fetch<SessionInfo>('/api/auth/login', {
      method: 'POST',
      body: { userId, pin, displayName }
    })
    session.value = result
    return result
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    session.value = null
    await navigateTo('/')
  }

  const isAdmin = computed(() => session.value?.role === 'ADMIN')
  const isLoggedIn = computed(() => !!session.value)

  return { session, initialized, fetchSession, login, logout, isAdmin, isLoggedIn }
}

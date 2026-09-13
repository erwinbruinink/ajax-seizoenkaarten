export default defineNuxtRouteMiddleware(async (to) => {
  const { session, initialized, fetchSession } = useAuth()

  if (!initialized.value) {
    await fetchSession()
  }

  if (to.path === '/admin' && session.value?.role !== 'ADMIN') {
    return navigateTo('/')
  }
})

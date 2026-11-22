export default defineNuxtRouteMiddleware(async to => {
  const user = useState<string | null | undefined>('user', () => undefined)
  if (user.value === undefined) {
    const res = await $fetch<{ user: string | null }>('/api/auth/me').catch(() => ({ user: null }))
    user.value = res.user
  }
  if (!user.value && to.path !== '/login') return navigateTo('/login')
  if (user.value && to.path === '/login') return navigateTo('/disparos')
})

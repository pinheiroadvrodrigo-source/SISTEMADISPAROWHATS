// Protege todas as rotas /api, menos login e o webhook da Meta.
const PUBLIC = ['/api/auth/login', '/api/auth/me', '/api/webhook']

export default defineEventHandler(async event => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/') || PUBLIC.includes(path)) return
  const session = await authSession(event)
  if (!session.data.user) throw createError({ statusCode: 401, message: 'Faça login' })
})

// Verificação do webhook pela Meta
export default defineEventHandler(event => {
  const q = getQuery(event)
  const { webhookVerifyToken } = useRuntimeConfig()
  if (q['hub.mode'] === 'subscribe' && webhookVerifyToken && q['hub.verify_token'] === webhookVerifyToken) {
    setHeader(event, 'Content-Type', 'text/plain')
    return String(q['hub.challenge'] ?? '')
  }
  throw createError({ statusCode: 403, message: 'Token de verificação inválido' })
})

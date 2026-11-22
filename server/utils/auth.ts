import type { H3Event } from 'h3'
import { timingSafeEqual } from 'node:crypto'

export function authSession(event: H3Event) {
  const { sessionSecret } = useRuntimeConfig()
  if (!sessionSecret || sessionSecret.length < 32) {
    throw createError({ statusCode: 500, message: 'Configure NUXT_SESSION_SECRET com pelo menos 32 caracteres' })
  }
  return useSession<{ user?: string }>(event, {
    password: sessionSecret,
    name: 'dw_session',
    maxAge: 60 * 60 * 24 * 7,
    // cookie seguro quando o site roda em https (inclusive atrás de proxy/Nginx)
    cookie: { httpOnly: true, sameSite: 'lax', secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https' },
  })
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

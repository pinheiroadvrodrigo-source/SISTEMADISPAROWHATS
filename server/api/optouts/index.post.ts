import { normalizePhone } from '#shared/template'
export default defineEventHandler(async event => {
  const { phone } = await readBody(event)
  const p = normalizePhone(phone, String(useRuntimeConfig().defaultCountryCode || '55'))
  if (!p) throw createError({ statusCode: 400, message: 'Telefone inválido' })
  db().prepare('INSERT OR IGNORE INTO optouts (phone, reason) VALUES (?, ?)').run(p, 'Adicionado manualmente')
  return { phone: p }
})

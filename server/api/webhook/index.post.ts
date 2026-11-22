import { createHmac } from 'node:crypto'

// Recebe status (enviado, entregue, lido, falha) e mensagens recebidas
export default defineEventHandler(async event => {
  const raw = (await readRawBody(event, 'utf8')) || ''
  const { metaAppSecret } = useRuntimeConfig()
  if (metaAppSecret) {
    const sig = getHeader(event, 'x-hub-signature-256') || ''
    const expected = 'sha256=' + createHmac('sha256', metaAppSecret).update(raw).digest('hex')
    if (!safeEqual(sig, expected)) throw createError({ statusCode: 401, message: 'Assinatura inválida' })
  }
  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 400, message: 'JSON inválido' })
  }
  const orphan = db().prepare('INSERT INTO orphan_statuses (wamid, payload) VALUES (?, ?)')
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {}
      for (const s of value.statuses || []) {
        if (!applyStatus(s)) orphan.run(s.id, JSON.stringify(s))
      }
      for (const m of value.messages || []) handleIncoming(m)
    }
  }
  // limpa status órfãos com mais de 2 dias
  db().prepare(`DELETE FROM orphan_statuses WHERE created_at < ?`).run(new Date(Date.now() - 2 * 864e5).toISOString())
  return 'ok'
})

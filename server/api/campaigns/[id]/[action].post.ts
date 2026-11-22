// pausar | retomar | cancelar
export default defineEventHandler(event => {
  const c = getCampaign(getRouterParam(event, 'id')!)
  const action = getRouterParam(event, 'action')
  const d = db()
  if (action === 'pause') {
    if (!['running', 'scheduled'].includes(c.status)) throw createError({ statusCode: 409, message: 'A campanha não está em andamento' })
    d.prepare(`UPDATE campaigns SET status = 'paused' WHERE id = ?`).run(c.id)
  } else if (action === 'resume') {
    if (c.status !== 'paused') throw createError({ statusCode: 409, message: 'A campanha não está pausada' })
    const future = c.scheduled_at && new Date(c.scheduled_at).getTime() > Date.now()
    d.prepare(`UPDATE campaigns SET status = ?, last_error = NULL WHERE id = ?`).run(future ? 'scheduled' : 'running', c.id)
  } else if (action === 'cancel') {
    if (['completed', 'canceled'].includes(c.status)) throw createError({ statusCode: 409, message: 'A campanha já terminou' })
    d.transaction(() => {
      d.prepare(`UPDATE campaigns SET status = 'canceled', finished_at = ? WHERE id = ?`).run(nowIso(), c.id)
      d.prepare(`UPDATE messages SET status = 'canceled' WHERE campaign_id = ? AND status = 'pending'`).run(c.id)
    })()
  } else {
    throw createError({ statusCode: 404, message: 'Ação inválida' })
  }
  return { status: (d.prepare('SELECT status FROM campaigns WHERE id = ?').get(c.id) as any).status }
})

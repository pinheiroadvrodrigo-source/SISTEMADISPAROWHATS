export default defineEventHandler(event => {
  const c = getCampaign(getRouterParam(event, 'id')!)
  if (c.status === 'running') throw createError({ statusCode: 409, message: 'Pause ou cancele a campanha antes de excluir' })
  db().prepare('DELETE FROM campaigns WHERE id = ?').run(c.id)
  return { ok: true }
})

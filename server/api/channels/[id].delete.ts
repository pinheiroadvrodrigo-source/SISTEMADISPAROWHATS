export default defineEventHandler(event => {
  const id = getRouterParam(event, 'id')!
  getChannel(id)
  const used = (db().prepare('SELECT COUNT(*) n FROM campaigns WHERE channel_id = ?').get(id) as any).n
  if (used) throw createError({ statusCode: 409, message: 'Este canal tem campanhas. Exclua as campanhas antes.' })
  db().prepare('DELETE FROM channels WHERE id = ?').run(id)
  return { ok: true }
})

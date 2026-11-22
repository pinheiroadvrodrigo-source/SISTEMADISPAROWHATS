export default defineEventHandler(event => {
  db().prepare('DELETE FROM optouts WHERE phone = ?').run(getRouterParam(event, 'phone'))
  return { ok: true }
})

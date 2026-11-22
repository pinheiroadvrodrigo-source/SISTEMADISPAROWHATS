const FILTERS: Record<string, string> = {
  pending: "status IN ('pending','sending')",
  sent: "status IN ('sent','delivered','read')",
  delivered: "status IN ('delivered','read')",
  read: "status = 'read'",
  failed: "status = 'failed'",
  canceled: "status = 'canceled'",
}

export default defineEventHandler(event => {
  const id = getRouterParam(event, 'id')!
  getCampaign(id)
  const q = getQuery(event)
  const where = ['campaign_id = ?']
  const params: any[] = [id]
  if (q.status && FILTERS[String(q.status)]) where.push(FILTERS[String(q.status)]!)
  if (q.q) {
    where.push('(phone LIKE ? OR name LIKE ?)')
    params.push(`%${String(q.q).replace(/\D/g, '') || q.q}%`, `%${q.q}%`)
  }
  const page = Math.max(1, Number(q.page) || 1)
  const size = 50
  const w = where.join(' AND ')
  const total = (db().prepare(`SELECT COUNT(*) n FROM messages WHERE ${w}`).get(...params) as any).n
  const items = db()
    .prepare(
      `SELECT id, phone, name, status, error_code, error_message, attempts, sent_at, delivered_at, read_at, failed_at
       FROM messages WHERE ${w} ORDER BY id LIMIT ? OFFSET ?`,
    )
    .all(...params, size, (page - 1) * size)
  return { items, total, page, pages: Math.max(1, Math.ceil(total / size)) }
})

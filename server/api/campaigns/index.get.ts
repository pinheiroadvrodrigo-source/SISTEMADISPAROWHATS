export default defineEventHandler(() => {
  const rows = db()
    .prepare(
      `SELECT c.id, c.name, c.status, c.template_name, c.scheduled_at, c.created_at, c.started_at, c.finished_at, c.total, c.last_error,
              ch.name AS channel_name, ch.display_phone,
              SUM(CASE WHEN m.status IN ('sent','delivered','read') THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN m.status IN ('delivered','read') THEN 1 ELSE 0 END) AS delivered,
              SUM(CASE WHEN m.status = 'read' THEN 1 ELSE 0 END) AS read,
              SUM(CASE WHEN m.status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM campaigns c
       JOIN channels ch ON ch.id = c.channel_id
       LEFT JOIN messages m ON m.campaign_id = c.id
       GROUP BY c.id ORDER BY c.id DESC`,
    )
    .all()
  return rows
})

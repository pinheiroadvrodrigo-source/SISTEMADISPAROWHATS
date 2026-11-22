export default defineEventHandler(event => {
  const c = getCampaign(getRouterParam(event, 'id')!)
  const ch = db().prepare('SELECT name, display_phone, verified_name FROM channels WHERE id = ?').get(c.channel_id) as any
  const tpl = JSON.parse(c.template_json)
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    template: tpl,
    mapping: JSON.parse(c.mapping_json || '{}'),
    header_media_url: c.header_media_url,
    scheduled_at: c.scheduled_at,
    rate_per_second: c.rate_per_second,
    created_at: c.created_at,
    started_at: c.started_at,
    finished_at: c.finished_at,
    last_error: c.last_error,
    channel: ch,
    stats: campaignStats(c.id),
  }
})

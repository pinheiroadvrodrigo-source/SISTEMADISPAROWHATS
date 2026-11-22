import { normalizePhone, templateSlots, headerMediaFormat, type Template } from '#shared/template'

export default defineEventHandler(async event => {
  const b = await readBody(event)
  const name = String(b.name || '').trim()
  if (!name) throw createError({ statusCode: 400, message: 'Dê um nome à campanha' })
  const ch = getChannel(b.channelId)
  const tpl: Template = b.template
  if (!tpl?.name || !tpl?.language || !Array.isArray(tpl.components)) throw createError({ statusCode: 400, message: 'Escolha um template' })
  if (tpl.status && tpl.status !== 'APPROVED') throw createError({ statusCode: 400, message: 'Só é possível disparar templates aprovados pela Meta' })

  const mapping = b.mapping || {}
  for (const s of templateSlots(tpl)) {
    if (!mapping[s.key]?.column && !String(mapping[s.key]?.value || '').trim()) {
      throw createError({ statusCode: 400, message: `Preencha a variável ${s.label}` })
    }
  }
  const mediaUrl = String(b.headerMediaUrl || '').trim() || null
  if (headerMediaFormat(tpl) && !/^https:\/\//.test(mediaUrl || '')) {
    throw createError({ statusCode: 400, message: 'Informe o link público (https) da mídia do cabeçalho' })
  }

  const rows: Record<string, unknown>[] = Array.isArray(b.rows) ? b.rows : []
  const phoneColumn = String(b.phoneColumn || '')
  const nameColumn = String(b.nameColumn || '')
  if (!rows.length || !phoneColumn) throw createError({ statusCode: 400, message: 'Envie a planilha e escolha a coluna de telefone' })
  if (rows.length > 100000) throw createError({ statusCode: 400, message: 'Máximo de 100.000 contatos por campanha' })

  let scheduledAt: string | null = null
  if (b.scheduledAt) {
    const dt = new Date(b.scheduledAt)
    if (isNaN(dt.getTime())) throw createError({ statusCode: 400, message: 'Data de agendamento inválida' })
    if (dt.getTime() > Date.now() + 30_000) scheduledAt = dt.toISOString()
  }
  const rate = Math.min(80, Math.max(1, Number(b.ratePerSecond) || 20))

  const { defaultCountryCode } = useRuntimeConfig()
  const d = db()
  const optouts = new Set((d.prepare('SELECT phone FROM optouts').all() as any[]).map(r => r.phone))
  const seen = new Set<string>()
  const valid: { phone: string; name: string | null; data: string }[] = []
  let invalid = 0, duplicates = 0, optedOut = 0
  for (const r of rows) {
    const phone = normalizePhone(r[phoneColumn], String(defaultCountryCode || '55'))
    if (!phone) { invalid++; continue }
    if (seen.has(phone)) { duplicates++; continue }
    seen.add(phone)
    if (optouts.has(phone)) { optedOut++; continue }
    valid.push({ phone, name: nameColumn ? String(r[nameColumn] ?? '') || null : null, data: JSON.stringify(r) })
  }
  if (!valid.length) throw createError({ statusCode: 400, message: 'Nenhum telefone válido na planilha' })

  const id = d.transaction(() => {
    const res = d
      .prepare(
        `INSERT INTO campaigns (name, channel_id, template_name, template_language, template_json, mapping_json, header_media_url, status, scheduled_at, rate_per_second, total, started_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        name, ch.id, tpl.name, tpl.language,
        JSON.stringify({ name: tpl.name, language: tpl.language, category: tpl.category, parameter_format: tpl.parameter_format, components: tpl.components }),
        JSON.stringify(mapping), mediaUrl, scheduledAt ? 'scheduled' : 'running', scheduledAt, rate, valid.length,
        scheduledAt ? null : nowIso(),
      )
    const ins = d.prepare('INSERT INTO messages (campaign_id, phone, name, data_json) VALUES (?,?,?,?)')
    for (const v of valid) ins.run(res.lastInsertRowid, v.phone, v.name, v.data)
    return Number(res.lastInsertRowid)
  })()

  return { id, total: valid.length, invalid, duplicates, optedOut, scheduled: !!scheduledAt }
})

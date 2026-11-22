// Fila de disparos persistida no SQLite.
// A cada segundo o worker pega até `rate_per_second` mensagens pendentes de cada campanha em andamento.
import { buildSendComponents, VariableError, type Template, type Mapping } from '#shared/template'

const RANK: Record<string, number> = { pending: 0, sending: 0, sent: 1, delivered: 2, read: 3 }
const MAX_ATTEMPTS = 5

export async function queueTick() {
  const d = db()
  const now = nowIso()

  // Campanhas agendadas cujo horário chegou
  d.prepare(
    `UPDATE campaigns SET status = 'running', started_at = COALESCE(started_at, ?)
     WHERE status = 'scheduled' AND scheduled_at <= ?`,
  ).run(now, now)

  const running = d
    .prepare(
      `SELECT c.*, ch.phone_number_id, ch.waba_id, ch.access_token
       FROM campaigns c JOIN channels ch ON ch.id = c.channel_id
       WHERE c.status = 'running'`,
    )
    .all() as any[]

  for (const c of running) {
    if (!c.started_at) d.prepare('UPDATE campaigns SET started_at = ? WHERE id = ?').run(now, c.id)

    const batch = d
      .prepare(
        `SELECT * FROM messages
         WHERE campaign_id = ? AND status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
         ORDER BY id LIMIT ?`,
      )
      .all(c.id, now, Math.max(1, c.rate_per_second)) as any[]

    if (!batch.length) {
      const left = (d.prepare(`SELECT COUNT(*) n FROM messages WHERE campaign_id = ? AND status IN ('pending','sending')`).get(c.id) as any).n
      if (!left) d.prepare(`UPDATE campaigns SET status = 'completed', finished_at = ? WHERE id = ? AND status = 'running'`).run(nowIso(), c.id)
      continue
    }

    const mark = d.prepare(`UPDATE messages SET status = 'sending' WHERE id = ?`)
    d.transaction(() => batch.forEach(m => mark.run(m.id)))()

    const tpl: Template = JSON.parse(c.template_json)
    const mapping: Mapping = JSON.parse(c.mapping_json || '{}')
    const results = await Promise.all(batch.map(m => sendOne(c, tpl, mapping, m)))

    const blocking = results.find(r => r?.blocking)
    if (blocking) {
      d.prepare(`UPDATE campaigns SET status = 'paused', last_error = ? WHERE id = ?`).run(blocking.blocking, c.id)
    }
  }
}

async function sendOne(c: any, tpl: Template, mapping: Mapping, m: any): Promise<{ blocking?: string } | void> {
  const d = db()
  const data = JSON.parse(m.data_json || '{}')
  try {
    const components = buildSendComponents(tpl, mapping, data, c.header_media_url)
    const res = await sendTemplateMessage(c, m.phone, { name: c.template_name, language: c.template_language, components })
    const wamid = res.messages?.[0]?.id || null
    d.prepare(`UPDATE messages SET status = 'sent', wamid = ?, sent_at = ?, attempts = attempts + 1, error_code = NULL, error_message = NULL WHERE id = ?`).run(
      wamid,
      nowIso(),
      m.id,
    )
    if (wamid) applyOrphans(wamid)
  } catch (err: any) {
    if (err instanceof VariableError) {
      return failMessage(m.id, 'VAR', err.message)
    }
    const e = err as MetaError
    const attempts = m.attempts + 1
    if (isCampaignBlocking(e)) {
      d.prepare(`UPDATE messages SET status = 'pending' WHERE id = ?`).run(m.id)
      return { blocking: `Campanha pausada automaticamente: ${metaErrorText(e)} (código ${e.code ?? '-'})` }
    }
    if (isRetryable(e) && attempts < MAX_ATTEMPTS) {
      const wait = 5000 * 2 ** (attempts - 1) // 5s, 10s, 20s, 40s
      d.prepare(`UPDATE messages SET status = 'pending', attempts = ?, next_attempt_at = ?, error_code = ?, error_message = ? WHERE id = ?`).run(
        attempts,
        new Date(Date.now() + wait).toISOString(),
        String(e.code ?? ''),
        `Tentando novamente: ${metaErrorText(e)}`,
        m.id,
      )
      return
    }
    d.prepare('UPDATE messages SET attempts = ? WHERE id = ?').run(attempts, m.id)
    failMessage(m.id, String(e.code ?? e.httpStatus ?? 'ERR'), metaErrorText(e))
  }
}

function failMessage(id: number, code: string, message: string) {
  db()
    .prepare(`UPDATE messages SET status = 'failed', error_code = ?, error_message = ?, failed_at = ? WHERE id = ?`)
    .run(code, message, nowIso(), id)
}

/** Aplica um status vindo do webhook da Meta. Retorna false se o wamid ainda não é conhecido. */
export function applyStatus(s: any): boolean {
  const d = db()
  const msg = d.prepare('SELECT id, status, delivered_at FROM messages WHERE wamid = ?').get(s.id) as any
  if (!msg) return false
  const at = s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : nowIso()
  const status = String(s.status)

  if (status === 'failed') {
    if (msg.status === 'read' || msg.status === 'delivered') return true
    const err = s.errors?.[0] || {}
    const text = err.error_data?.details || err.message || err.title || 'Falha na entrega'
    d.prepare(`UPDATE messages SET status = 'failed', error_code = ?, error_message = ?, failed_at = ? WHERE id = ?`).run(String(err.code ?? ''), text, at, msg.id)
    return true
  }
  if (!(status in RANK) || msg.status === 'failed' || RANK[status]! <= (RANK[msg.status] ?? 0)) return true

  if (status === 'sent') d.prepare(`UPDATE messages SET status = 'sent', sent_at = COALESCE(sent_at, ?) WHERE id = ?`).run(at, msg.id)
  if (status === 'delivered') d.prepare(`UPDATE messages SET status = 'delivered', delivered_at = ? WHERE id = ?`).run(at, msg.id)
  if (status === 'read')
    d.prepare(`UPDATE messages SET status = 'read', read_at = ?, delivered_at = COALESCE(delivered_at, ?) WHERE id = ?`).run(at, at, msg.id)
  return true
}

function applyOrphans(wamid: string) {
  const d = db()
  const rows = d.prepare('SELECT rowid, payload FROM orphan_statuses WHERE wamid = ? ORDER BY rowid').all(wamid) as any[]
  for (const r of rows) applyStatus(JSON.parse(r.payload))
  if (rows.length) d.prepare('DELETE FROM orphan_statuses WHERE wamid = ?').run(wamid)
}

const OPTOUT_WORDS = ['sair', 'parar', 'pare', 'stop', 'cancelar', 'descadastrar', 'remover']

/** Contato respondeu SAIR/PARAR: entra na lista de descadastrados. */
export function handleIncoming(msg: any) {
  const text = String(msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || '')
    .trim()
    .toLowerCase()
  if (OPTOUT_WORDS.includes(text) && msg.from) {
    db().prepare('INSERT OR IGNORE INTO optouts (phone, reason) VALUES (?, ?)').run(String(msg.from), `Respondeu "${text}"`)
  }
}

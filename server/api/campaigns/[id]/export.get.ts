// Relatório da campanha em CSV (abre no Excel)
const LABEL: Record<string, string> = {
  pending: 'Pendente', sending: 'Enviando', sent: 'Enviado', delivered: 'Entregue', read: 'Lido', failed: 'Falha', canceled: 'Cancelado',
}
const fmt = (v?: string) => (v ? new Date(v).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '')
const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export default defineEventHandler(event => {
  const c = getCampaign(getRouterParam(event, 'id')!)
  const rows = db().prepare('SELECT * FROM messages WHERE campaign_id = ? ORDER BY id').all(c.id) as any[]
  const lines = [['Telefone', 'Nome', 'Status', 'Enviado em', 'Entregue em', 'Lido em', 'Erro'].map(cell).join(';')]
  for (const m of rows) {
    lines.push([m.phone, m.name, LABEL[m.status] || m.status, fmt(m.sent_at), fmt(m.delivered_at), fmt(m.read_at), m.error_message].map(cell).join(';'))
  }
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="campanha-${c.id}.csv"`)
  return '﻿' + lines.join('\r\n')
})

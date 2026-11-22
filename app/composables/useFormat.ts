export function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function pct(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 1000) / 10}%`.replace('.', ',')
}

export function fmtPhone(p?: string | null) {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4)
    const n = d.slice(4)
    return `+55 (${ddd}) ${n.slice(0, n.length - 4)}-${n.slice(-4)}`
  }
  return '+' + d
}

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: string }> = {
  scheduled: { label: 'Agendada', tone: 'blue' },
  running: { label: 'Em andamento', tone: 'green' },
  paused: { label: 'Pausada', tone: 'amber' },
  completed: { label: 'Concluída', tone: 'gray' },
  canceled: { label: 'Cancelada', tone: 'red' },
}

export const MESSAGE_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Na fila', tone: 'gray' },
  sending: { label: 'Enviando', tone: 'gray' },
  sent: { label: 'Enviado', tone: 'blue' },
  delivered: { label: 'Entregue', tone: 'green' },
  read: { label: 'Lido', tone: 'teal' },
  failed: { label: 'Falha', tone: 'red' },
  canceled: { label: 'Cancelado', tone: 'gray' },
}

export const TEMPLATE_STATUS: Record<string, { label: string; tone: string }> = {
  APPROVED: { label: 'Aprovado', tone: 'green' },
  PENDING: { label: 'Em análise', tone: 'amber' },
  IN_APPEAL: { label: 'Em recurso', tone: 'amber' },
  REJECTED: { label: 'Rejeitado', tone: 'red' },
  PAUSED: { label: 'Pausado', tone: 'amber' },
  DISABLED: { label: 'Desativado', tone: 'red' },
}

export const CATEGORY: Record<string, string> = { MARKETING: 'Marketing', UTILITY: 'Utilidade', AUTHENTICATION: 'Autenticação' }

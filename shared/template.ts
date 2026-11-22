// Regras de template usadas tanto no painel (preview) quanto no servidor (envio).

export interface TplButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | string
  text: string
  url?: string
  phone_number?: string
}

export interface TplComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | string
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | string
  text?: string
  buttons?: TplButton[]
}

export interface Template {
  id?: string
  name: string
  language: string
  status?: string
  category?: string
  parameter_format?: 'NAMED' | 'POSITIONAL' | string
  components: TplComponent[]
}

export interface Slot {
  key: string // ex.: "body:nome", "header:1", "button:0:1"
  label: string
  variable: string
}

/** Uma variável é preenchida com uma coluna da planilha e/ou um valor padrão. */
export interface SlotMapping {
  column?: string
  value?: string
}

export type Mapping = Record<string, SlotMapping>

export const MEDIA_FORMATS = ['IMAGE', 'VIDEO', 'DOCUMENT']

export function extractVars(text = ''): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!out.includes(m[1]!)) out.push(m[1]!)
  }
  return out
}

export const getComp = (tpl: Pick<Template, 'components'>, type: string) =>
  tpl.components?.find(c => c.type?.toUpperCase() === type)

export function headerMediaFormat(tpl: Pick<Template, 'components'>): string | null {
  const h = getComp(tpl, 'HEADER')
  return h && MEDIA_FORMATS.includes(String(h.format).toUpperCase()) ? String(h.format).toUpperCase() : null
}

/** Lista todas as variáveis que o usuário precisa preencher num template. */
export function templateSlots(tpl: Pick<Template, 'components'>): Slot[] {
  const slots: Slot[] = []
  const header = getComp(tpl, 'HEADER')
  if (header && String(header.format).toUpperCase() === 'TEXT') {
    for (const v of extractVars(header.text)) slots.push({ key: `header:${v}`, label: `Cabeçalho {{${v}}}`, variable: v })
  }
  const body = getComp(tpl, 'BODY')
  for (const v of extractVars(body?.text)) slots.push({ key: `body:${v}`, label: `Mensagem {{${v}}}`, variable: v })
  const buttons = getComp(tpl, 'BUTTONS')?.buttons || []
  buttons.forEach((b, i) => {
    if (String(b.type).toUpperCase() === 'URL') {
      for (const v of extractVars(b.url)) slots.push({ key: `button:${i}:${v}`, label: `Botão "${b.text}" (final do link)`, variable: v })
    }
  })
  return slots
}

/** Valor de texto aceito pela Meta: sem quebras de linha, tab ou espaços repetidos. */
export function cleanParam(v: unknown): string {
  return String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim()
}

export function resolveSlot(mapping: Mapping, key: string, row: Record<string, unknown>): string {
  const m = mapping[key] || {}
  const fromColumn = m.column ? cleanParam(row[m.column]) : ''
  return fromColumn || cleanParam(m.value)
}

/** Valores por variável para o preview (ex.: { "body:nome": "Israel" }). */
export function previewValues(tpl: Pick<Template, 'components'>, mapping: Mapping, row: Record<string, unknown>) {
  const values: Record<string, string> = {}
  for (const s of templateSlots(tpl)) values[s.key] = resolveSlot(mapping, s.key, row)
  return values
}

export class VariableError extends Error {}

/** Monta o array "components" do envio na Cloud API. */
export function buildSendComponents(tpl: Template, mapping: Mapping, row: Record<string, unknown>, mediaUrl?: string | null) {
  const named = String(tpl.parameter_format).toUpperCase() === 'NAMED'
  const out: any[] = []
  const need = (key: string, variable: string) => {
    const text = resolveSlot(mapping, key, row)
    if (!text) throw new VariableError(`Variável {{${variable}}} ficou vazia para este contato`)
    return text
  }
  const param = (key: string, variable: string) =>
    named ? { type: 'text', parameter_name: variable, text: need(key, variable) } : { type: 'text', text: need(key, variable) }

  const header = getComp(tpl, 'HEADER')
  if (header) {
    const fmt = String(header.format).toUpperCase()
    if (fmt === 'TEXT') {
      const vars = extractVars(header.text)
      if (vars.length) out.push({ type: 'header', parameters: vars.map(v => param(`header:${v}`, v)) })
    } else if (MEDIA_FORMATS.includes(fmt)) {
      if (!mediaUrl) throw new VariableError('Este template exige um link de mídia no cabeçalho')
      const kind = fmt.toLowerCase()
      out.push({ type: 'header', parameters: [{ type: kind, [kind]: { link: mediaUrl } }] })
    }
  }

  const bodyVars = extractVars(getComp(tpl, 'BODY')?.text)
  if (bodyVars.length) out.push({ type: 'body', parameters: bodyVars.map(v => param(`body:${v}`, v)) })

  const buttons = getComp(tpl, 'BUTTONS')?.buttons || []
  buttons.forEach((b, i) => {
    if (String(b.type).toUpperCase() !== 'URL') return
    const vars = extractVars(b.url)
    if (!vars.length) return
    out.push({
      type: 'button',
      sub_type: 'url',
      index: String(i),
      parameters: vars.map(v => ({ type: 'text', text: need(`button:${i}:${v}`, v) })),
    })
  })
  return out
}

/** Substitui {{var}} pelos valores; usado no preview. */
export function fillText(text: string | undefined, prefix: string, values: Record<string, string>) {
  return (text || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (all, v) => values[`${prefix}${v}`] || all)
}

/** Normaliza telefone para o formato internacional só com dígitos. */
export function normalizePhone(raw: unknown, defaultCountry = '55'): string | null {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (defaultCountry === '55' && (d.length === 10 || d.length === 11)) d = '55' + d
  else if (defaultCountry !== '55' && d.length <= 10 && d.length >= 7) d = defaultCountry + d
  if (d.length < 10 || d.length > 15) return null
  return d
}

/** Tenta descobrir qual coluna da planilha é o telefone. */
export function guessPhoneColumn(columns: string[], rows: Record<string, unknown>[]): string | null {
  const byName = columns.find(c => /telefone|celular|whats|fone|phone|numero|número|contato/i.test(c))
  if (byName) return byName
  const sample = rows.slice(0, 20)
  return columns.find(c => sample.filter(r => normalizePhone(r[c])).length >= Math.max(1, sample.length * 0.6)) || null
}

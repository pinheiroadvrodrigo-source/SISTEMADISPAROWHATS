// Cliente da WhatsApp Cloud API (Graph API da Meta)

export class MetaError extends Error {
  constructor(
    message: string,
    public code?: number,
    public subcode?: number,
    public details?: string,
    public httpStatus?: number,
  ) {
    super(message)
  }
}

interface ChannelCreds {
  phone_number_id: string
  waba_id: string
  access_token: string
}

function baseUrl() {
  const { graphUrl, graphVersion } = useRuntimeConfig()
  return `${String(graphUrl).replace(/\/$/, '')}/${graphVersion}`
}

async function graph<T = any>(path: string, token: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${baseUrl()}/${path}`, {
      method: opts.method || 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(20000),
    })
  } catch (e: any) {
    throw new MetaError(`Falha de conexão com a Meta: ${e?.message || e}`, undefined, undefined, undefined, 0)
  }
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    const e = json.error || {}
    throw new MetaError(e.error_user_msg || e.message || `Erro HTTP ${res.status}`, e.code, e.error_subcode, e.error_data?.details, res.status)
  }
  return json
}

export function getPhoneInfo(ch: ChannelCreds) {
  return graph<{ display_phone_number: string; verified_name: string; quality_rating?: string }>(
    `${ch.phone_number_id}?fields=display_phone_number,verified_name,quality_rating`,
    ch.access_token,
  )
}

export async function listTemplates(ch: ChannelCreds) {
  const all: any[] = []
  let after = ''
  for (let page = 0; page < 20; page++) {
    const q = `fields=id,name,language,status,category,components,parameter_format&limit=100${after ? `&after=${after}` : ''}`
    const res: any = await graph(`${ch.waba_id}/message_templates?${q}`, ch.access_token)
    all.push(...(res.data || []))
    after = res.paging?.cursors?.after
    if (!res.paging?.next || !after) break
  }
  return all
}

export function createTemplate(ch: ChannelCreds, payload: any) {
  return graph<{ id: string; status: string; category: string }>(`${ch.waba_id}/message_templates`, ch.access_token, {
    method: 'POST',
    body: payload,
  })
}

export function sendTemplateMessage(ch: ChannelCreds, to: string, template: { name: string; language: string; components: any[] }) {
  return graph<{ messages?: { id: string }[] }>(`${ch.phone_number_id}/messages`, ch.access_token, {
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.components.length ? { components: template.components } : {}),
      },
    },
  })
}

/** Erros temporários: a mensagem volta para a fila e é tentada de novo. */
export function isRetryable(e: MetaError) {
  if (!e.httpStatus || e.httpStatus >= 500) return true
  return [1, 2, 4, 80007, 130429, 131000, 131016, 131056, 133004].includes(Number(e.code))
}

/** Erros que afetam a campanha inteira: pausamos em vez de queimar a lista. */
export function isCampaignBlocking(e: MetaError) {
  return [10, 190, 200, 368, 131031, 131042, 132001, 132015, 132016].includes(Number(e.code))
}

export function metaErrorText(e: MetaError) {
  return [e.message, e.details].filter(Boolean).join(' — ')
}

import { extractVars } from '#shared/template'

// Cria um template na Meta a partir do formulário do painel.
export default defineEventHandler(async event => {
  const ch = getChannel(getRouterParam(event, 'id')!)
  const b = await readBody(event)
  const name = String(b.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '')
  if (!name) throw createError({ statusCode: 400, message: 'Dê um nome ao template' })
  if (!['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(b.category)) throw createError({ statusCode: 400, message: 'Categoria inválida' })
  const body = String(b.body || '').trim()
  if (!body) throw createError({ statusCode: 400, message: 'O corpo da mensagem é obrigatório' })

  const headerText = b.headerType === 'TEXT' ? String(b.headerText || '').trim() : ''
  const allVars = [...extractVars(headerText), ...extractVars(body)]
  const positional = allVars.length > 0 && allVars.every(v => /^\d+$/.test(v))
  const examples: Record<string, string> = b.examples || {}

  for (const v of allVars) {
    if (!positional && !/^[a-z_][a-z0-9_]*$/.test(v)) {
      throw createError({ statusCode: 400, message: `Variável {{${v}}} inválida: use só letras minúsculas, números e _ (ex.: {{nome}})` })
    }
    if (!String(examples[v] || '').trim()) throw createError({ statusCode: 400, message: `Informe um exemplo para {{${v}}} — a Meta exige` })
  }
  if (/^\s*\{\{|\}\}\s*$/.test(body)) {
    throw createError({ statusCode: 400, message: 'A Meta não aceita a mensagem começando ou terminando com variável' })
  }

  const components: any[] = []
  if (headerText) {
    const hv = extractVars(headerText)
    const comp: any = { type: 'HEADER', format: 'TEXT', text: headerText }
    if (hv.length) {
      comp.example = positional
        ? { header_text: hv.map(v => examples[v]) }
        : { header_text_named_params: hv.map(v => ({ param_name: v, example: examples[v] })) }
    }
    components.push(comp)
  }
  const bv = extractVars(body)
  const bodyComp: any = { type: 'BODY', text: body }
  if (bv.length) {
    bodyComp.example = positional
      ? { body_text: [bv.map(v => examples[v])] }
      : { body_text_named_params: bv.map(v => ({ param_name: v, example: examples[v] })) }
  }
  components.push(bodyComp)
  if (String(b.footer || '').trim()) components.push({ type: 'FOOTER', text: String(b.footer).trim() })

  const buttons = (b.buttons || [])
    .filter((x: any) => String(x.text || '').trim())
    .map((x: any) => {
      if (x.type === 'URL') {
        const btn: any = { type: 'URL', text: x.text.trim(), url: String(x.url || '').trim() }
        if (/\{\{1\}\}/.test(btn.url)) {
          if (!x.example) throw createError({ statusCode: 400, message: `Informe um link de exemplo para o botão "${btn.text}"` })
          btn.example = [x.example]
        }
        return btn
      }
      if (x.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: x.text.trim(), phone_number: String(x.phone || '').replace(/\D/g, '') }
      return { type: 'QUICK_REPLY', text: x.text.trim() }
    })
  if (buttons.length) components.push({ type: 'BUTTONS', buttons })

  const payload: any = { name, language: b.language || 'pt_BR', category: b.category, components }
  if (allVars.length && !positional) payload.parameter_format = 'NAMED'

  try {
    return await createTemplate(ch, payload)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: `A Meta recusou o template: ${metaErrorText(e)}` })
  }
})

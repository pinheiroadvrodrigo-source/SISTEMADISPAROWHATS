export default defineEventHandler(async event => {
  const ch = getChannel(getRouterParam(event, 'id')!)
  try {
    const list = await listTemplates(ch)
    return list.map((t: any) => ({
      id: t.id,
      name: t.name,
      language: t.language,
      status: t.status,
      category: t.category,
      parameter_format: t.parameter_format || 'POSITIONAL',
      components: t.components || [],
    }))
  } catch (e: any) {
    throw createError({ statusCode: 502, message: `Não foi possível buscar os templates: ${e.message}` })
  }
})

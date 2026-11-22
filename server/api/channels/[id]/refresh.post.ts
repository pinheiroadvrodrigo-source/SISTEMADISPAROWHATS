// Atualiza nome verificado e qualidade do número
export default defineEventHandler(async event => {
  const ch = getChannel(getRouterParam(event, 'id')!)
  try {
    const info = await getPhoneInfo(ch)
    db().prepare('UPDATE channels SET display_phone=?, verified_name=?, quality_rating=? WHERE id=?').run(info.display_phone_number, info.verified_name, info.quality_rating || null, ch.id)
    return info
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})

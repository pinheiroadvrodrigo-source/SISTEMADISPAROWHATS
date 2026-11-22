export default defineEventHandler(async event => {
  const b = await readBody(event)
  const name = String(b.name || '').trim()
  const phone_number_id = String(b.phoneNumberId || '').trim()
  const waba_id = String(b.wabaId || '').trim()
  const access_token = String(b.accessToken || '').trim()
  if (!name || !phone_number_id || !waba_id || !access_token) {
    throw createError({ statusCode: 400, message: 'Preencha nome, Phone Number ID, WABA ID e token' })
  }
  // Valida as credenciais direto na Meta antes de salvar
  let info
  try {
    info = await getPhoneInfo({ phone_number_id, waba_id, access_token })
    await listTemplates({ phone_number_id, waba_id, access_token })
  } catch (e: any) {
    throw createError({ statusCode: 400, message: `A Meta recusou as credenciais: ${e.message}` })
  }
  const exists = db().prepare('SELECT id FROM channels WHERE phone_number_id = ?').get(phone_number_id) as any
  if (exists) {
    db()
      .prepare('UPDATE channels SET name=?, waba_id=?, access_token=?, display_phone=?, verified_name=?, quality_rating=? WHERE id=?')
      .run(name, waba_id, access_token, info.display_phone_number, info.verified_name, info.quality_rating || null, exists.id)
    return { id: exists.id, updated: true }
  }
  const r = db()
    .prepare(
      'INSERT INTO channels (name, phone_number_id, waba_id, access_token, display_phone, verified_name, quality_rating) VALUES (?,?,?,?,?,?,?)',
    )
    .run(name, phone_number_id, waba_id, access_token, info.display_phone_number, info.verified_name, info.quality_rating || null)
  return { id: r.lastInsertRowid }
})

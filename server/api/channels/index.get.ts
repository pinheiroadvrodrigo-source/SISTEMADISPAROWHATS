export default defineEventHandler(() => {
  const rows = db()
    .prepare(
      `SELECT id, name, phone_number_id, waba_id, display_phone, verified_name, quality_rating, created_at,
              substr(access_token, -6) AS token_end
       FROM channels ORDER BY id DESC`,
    )
    .all()
  return rows
})

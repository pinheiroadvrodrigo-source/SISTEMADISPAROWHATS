export default defineEventHandler(async event => {
  const { email, password } = await readBody(event)
  const { adminEmail, adminPassword } = useRuntimeConfig()
  if (!adminEmail || !adminPassword) {
    throw createError({ statusCode: 500, message: 'Configure NUXT_ADMIN_EMAIL e NUXT_ADMIN_PASSWORD no .env' })
  }
  const ok = safeEqual(String(email || '').trim().toLowerCase(), adminEmail.toLowerCase()) && safeEqual(String(password || ''), adminPassword)
  if (!ok) {
    await new Promise(r => setTimeout(r, 800)) // dificulta tentativa e erro
    throw createError({ statusCode: 401, message: 'E-mail ou senha incorretos' })
  }
  const session = await authSession(event)
  await session.update({ user: adminEmail })
  return { user: adminEmail }
})

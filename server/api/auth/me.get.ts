export default defineEventHandler(async event => {
  const session = await authSession(event)
  return { user: session.data.user || null }
})

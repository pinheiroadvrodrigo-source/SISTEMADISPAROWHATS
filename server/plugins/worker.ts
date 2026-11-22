// Inicia o worker da fila junto com o servidor (roda 24h na VPS).
export default defineNitroPlugin(() => {
  const g = globalThis as any
  if (g.__disparosWorker) clearInterval(g.__disparosWorker)

  // Se o servidor caiu no meio de um envio, devolve essas mensagens para a fila
  db().prepare(`UPDATE messages SET status = 'pending' WHERE status = 'sending'`).run()

  let busy = false
  g.__disparosWorker = setInterval(async () => {
    if (busy) return
    busy = true
    try {
      await queueTick()
    } catch (e) {
      console.error('[fila] erro:', e)
    } finally {
      busy = false
    }
  }, 1000)
  console.log('[fila] worker de disparos iniciado')
})

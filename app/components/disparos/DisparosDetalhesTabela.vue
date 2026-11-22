<script setup lang="ts">
const props = defineProps<{ id: number; refreshKey: number }>()
const filtros = [
  { v: '', l: 'Todos' },
  { v: 'pending', l: 'Na fila' },
  { v: 'sent', l: 'Enviados' },
  { v: 'delivered', l: 'Entregues' },
  { v: 'read', l: 'Lidos' },
  { v: 'failed', l: 'Falhas' },
]
const status = ref('')
const q = ref('')
const page = ref(1)
const data = ref<{ items: any[]; total: number; pages: number }>({ items: [], total: 0, pages: 1 })
const aberto = ref<number | null>(null)

async function load() {
  data.value = await api(`/api/campaigns/${props.id}/messages`, { query: { status: status.value, q: q.value, page: page.value } })
}
let deb: any
watch([status, page], load)
watch(q, () => {
  clearTimeout(deb)
  deb = setTimeout(() => { page.value = 1; load() }, 300)
})
watch(() => props.refreshKey, load)
watch(status, () => (page.value = 1))
onMounted(load)

function quando(m: any) {
  if (m.status === 'read') return `Leu às ${fmtDate(m.read_at)}`
  if (m.status === 'delivered') return `Entregue ${fmtDate(m.delivered_at)}`
  if (m.status === 'sent') return `Enviado ${fmtDate(m.sent_at)}`
  if (m.status === 'failed') return fmtDate(m.failed_at)
  return m.attempts ? `${m.attempts} tentativa(s)` : ''
}
</script>

<template>
  <div class="card">
    <div class="card-pad row between wrap top">
      <div class="tabs">
        <button v-for="f in filtros" :key="f.v" class="tab" :class="{ active: status === f.v }" @click="status = f.v">{{ f.l }}</button>
      </div>
      <input v-model="q" class="busca" placeholder="Buscar telefone ou nome" />
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Contato</th><th>Status</th><th>Quando</th><th>Detalhe</th></tr></thead>
        <tbody>
          <template v-for="m in data.items" :key="m.id">
            <tr :class="{ clickable: m.error_message }" @click="m.error_message && (aberto = aberto === m.id ? null : m.id)">
              <td>
                <strong class="phone">{{ fmtPhone(m.phone) }}</strong>
                <div v-if="m.name" class="small muted">{{ m.name }}</div>
              </td>
              <td><UiStatusBadge :status="m.status" kind="message" /></td>
              <td class="small muted">{{ quando(m) }}</td>
              <td class="small">
                <span v-if="m.error_message" class="err">{{ aberto === m.id ? 'Ocultar' : 'Ver motivo' }} ›</span>
              </td>
            </tr>
            <tr v-if="aberto === m.id">
              <td colspan="4" class="motivo">
                <strong>Código {{ m.error_code || '—' }}:</strong> {{ m.error_message }}
              </td>
            </tr>
          </template>
          <tr v-if="!data.items.length"><td colspan="4" class="muted center">Nenhum contato neste filtro</td></tr>
        </tbody>
      </table>
    </div>
    <div v-if="data.pages > 1" class="card-pad row between">
      <span class="small muted">{{ data.total.toLocaleString('pt-BR') }} contatos</span>
      <div class="row">
        <button class="btn sm" :disabled="page === 1" @click="page--">‹ Anterior</button>
        <span class="small">{{ page }} / {{ data.pages }}</span>
        <button class="btn sm" :disabled="page >= data.pages" @click="page++">Próxima ›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone { white-space: nowrap; }
.top { border-bottom: 1px solid var(--line); }
.busca { width: 240px; }
.err { color: var(--red); font-weight: 600; }
.motivo { background: var(--red-soft); color: var(--red); font-size: 13px; }
.center { text-align: center; padding: 30px; }
</style>

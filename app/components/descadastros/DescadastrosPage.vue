<script setup lang="ts">
const lista = ref<any[]>([])
const phone = ref('')
const error = ref('')
async function load() {
  lista.value = await api('/api/optouts')
}
async function add() {
  error.value = ''
  try {
    await api('/api/optouts', { method: 'POST', body: { phone: phone.value } })
    phone.value = ''
    load()
  } catch (e) {
    error.value = errorText(e)
  }
}
async function remover(p: string) {
  if (!confirm(`Voltar a enviar mensagens para ${fmtPhone(p)}?`)) return
  await api(`/api/optouts/${p}`, { method: 'DELETE' })
  load()
}
onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader title="Descadastros" subtitle="Números que nunca recebem campanhas. Quem responde SAIR, PARAR ou STOP entra aqui sozinho." />
    <div class="stack">
      <form class="card card-pad row" @submit.prevent="add">
        <input v-model="phone" placeholder="Adicionar número manualmente (ex.: 91 99999-0000)" />
        <button class="btn primary">Adicionar</button>
      </form>
      <div v-if="error" class="alert error">{{ error }}</div>
      <div class="card">
        <UiEmptyState v-if="!lista.length" title="Ninguém descadastrado" />
        <table v-else class="table">
          <thead><tr><th>Telefone</th><th>Motivo</th><th>Data</th><th></th></tr></thead>
          <tbody>
            <tr v-for="o in lista" :key="o.phone">
              <td><strong>{{ fmtPhone(o.phone) }}</strong></td>
              <td class="muted">{{ o.reason }}</td>
              <td class="muted small">{{ fmtDate(o.created_at) }}</td>
              <td><button class="btn sm ghost" @click="remover(o.phone)">Remover</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

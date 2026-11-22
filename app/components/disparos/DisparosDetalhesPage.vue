<script setup lang="ts">
const props = defineProps<{ id: number }>()
const route = useRoute()
const camp = ref<any | null>(null)
const error = ref('')
const refreshKey = ref(0)
let timer: any

async function load() {
  try {
    camp.value = await api(`/api/campaigns/${props.id}`)
    refreshKey.value++
  } catch (e) {
    error.value = errorText(e)
  }
}
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (camp.value && ['running', 'scheduled'].includes(camp.value.status)) load()
  }, 3000)
})
onUnmounted(() => clearInterval(timer))

const aviso = computed(() => {
  if (!route.query.novo) return ''
  const parts = []
  if (Number(route.query.inv)) parts.push(`${route.query.inv} telefone(s) inválido(s)`)
  if (Number(route.query.dup)) parts.push(`${route.query.dup} duplicado(s)`)
  if (Number(route.query.opt)) parts.push(`${route.query.opt} descadastrado(s)`)
  return parts.length ? `Campanha criada. Removemos ${parts.join(', ')}.` : 'Campanha criada com sucesso.'
})
</script>

<template>
  <div>
    <div v-if="error" class="alert error">{{ error }}</div>
    <template v-if="camp">
      <UiPageHeader :title="camp.name" :subtitle="`${camp.template.name} · ${camp.channel?.name} (${camp.channel?.display_phone})`">
        <UiStatusBadge :status="camp.status" kind="campaign" />
        <DisparosDetalhesAcoes :camp="camp" @changed="load" />
      </UiPageHeader>
      <div class="stack">
        <div v-if="aviso" class="alert ok">{{ aviso }}</div>
        <div v-if="camp.last_error" class="alert error">{{ camp.last_error }}</div>
        <div v-if="camp.status === 'scheduled'" class="alert info">Agendada para {{ fmtDate(camp.scheduled_at) }}.</div>
        <DisparosDetalhesResumo :camp="camp" />
        <DisparosDetalhesTabela :id="camp.id" :refresh-key="refreshKey" />
      </div>
    </template>
    <div v-else-if="!error" class="muted">Carregando…</div>
  </div>
</template>

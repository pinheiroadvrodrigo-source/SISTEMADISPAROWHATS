<script setup lang="ts">
const campanhas = ref<any[]>([])
const loading = ref(true)
let timer: any

async function load() {
  try {
    campanhas.value = await api('/api/campaigns')
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (campanhas.value.some(c => ['running', 'scheduled'].includes(c.status))) load()
  }, 4000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <UiPageHeader title="Disparos" subtitle="Campanhas de mensagens em massa pela API oficial">
      <NuxtLink to="/disparos/nova" class="btn primary">+ Nova campanha</NuxtLink>
    </UiPageHeader>
    <DisparosLista :campanhas="campanhas" :loading="loading" />
  </div>
</template>

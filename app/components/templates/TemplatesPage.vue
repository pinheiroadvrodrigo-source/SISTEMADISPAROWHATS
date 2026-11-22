<script setup lang="ts">
const { canais, load: loadCanais } = useCanais()
const canalId = ref<number | null>(null)
const templates = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const showForm = ref(false)

async function carregar() {
  if (!canalId.value) return
  loading.value = true
  error.value = ''
  try {
    templates.value = await api(`/api/channels/${canalId.value}/templates`)
  } catch (e) {
    error.value = errorText(e)
    templates.value = []
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await loadCanais()
  canalId.value = canais.value[0]?.id ?? null
})
watch(canalId, carregar)
</script>

<template>
  <div>
    <UiPageHeader title="Templates" subtitle="Modelos de mensagem aprovados pela Meta para iniciar conversas">
      <select v-model="canalId" class="sel">
        <option v-for="c in canais" :key="c.id" :value="c.id">{{ c.name }} · {{ c.display_phone }}</option>
      </select>
      <button class="btn" :disabled="!canalId || loading" @click="carregar">↻ Atualizar</button>
      <button class="btn primary" :disabled="!canalId" @click="showForm = true">+ Novo template</button>
    </UiPageHeader>

    <div v-if="!canais.length" class="card">
      <UiEmptyState title="Conecte um número primeiro" text="Os templates ficam na conta do WhatsApp Business ligada ao número.">
        <NuxtLink to="/canais" class="btn primary">Ir para Canais</NuxtLink>
      </UiEmptyState>
    </div>
    <div v-else class="stack">
      <div v-if="error" class="alert error">{{ error }}</div>
      <TemplatesLista :templates="templates" :loading="loading" />
    </div>

    <UiModal v-if="showForm && canalId" title="Novo template" wide @close="showForm = false">
      <TemplatesForm :canal-id="canalId" @saved="showForm = false; carregar()" />
    </UiModal>
  </div>
</template>

<style scoped>
.sel { width: auto; min-width: 220px; }
</style>

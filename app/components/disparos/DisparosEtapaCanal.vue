<script setup lang="ts">
const emit = defineEmits<{ next: []; back: [] }>()
const { c } = useNovaCampanha()
const { canais, load } = useCanais()
const templates = ref<any[]>([])
const loading = ref(false)
const error = ref('')

async function carregarTemplates() {
  if (!c.value.channelId) return
  loading.value = true
  error.value = ''
  try {
    templates.value = await api(`/api/channels/${c.value.channelId}/templates`)
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
function escolherCanal(id: number) {
  if (c.value.channelId !== id) c.value.template = null
  c.value.channelId = id
}
function escolher(t: any) {
  if (t.status !== 'APPROVED') return
  if (c.value.template?.id !== t.id) c.value.mapping = {}
  c.value.template = t
}
onMounted(async () => {
  await load()
  if (!c.value.channelId && canais.value.length === 1) c.value.channelId = canais.value[0]!.id
  carregarTemplates()
})
watch(() => c.value.channelId, carregarTemplates)
const ordenados = computed(() => [...templates.value].sort((a, b) => Number(b.status === 'APPROVED') - Number(a.status === 'APPROVED')))
</script>

<template>
  <div class="stack">
    <div class="card card-pad stack">
      <h2>Número que vai disparar</h2>
      <div v-if="!canais.length" class="alert warn">Nenhum canal conectado. <NuxtLink to="/canais"><u>Conectar número</u></NuxtLink></div>
      <div class="canais">
        <button v-for="ch in canais" :key="ch.id" class="opt" :class="{ sel: c.channelId === ch.id }" @click="escolherCanal(ch.id)">
          <strong>{{ ch.name }}</strong>
          <span class="small muted">{{ ch.display_phone }} · API oficial</span>
        </button>
      </div>
    </div>

    <div v-if="c.channelId" class="grid">
      <div class="card card-pad stack">
        <div class="row between">
          <h2>Template</h2>
          <button class="btn sm" :disabled="loading" @click="carregarTemplates">↻</button>
        </div>
        <div v-if="error" class="alert error">{{ error }}</div>
        <div v-if="loading" class="muted">Buscando templates na Meta…</div>
        <div v-else-if="!templates.length" class="muted">Nenhum template. <NuxtLink to="/templates"><u>Criar template</u></NuxtLink></div>
        <div class="lista">
          <button
            v-for="t in ordenados"
            :key="t.id"
            class="opt"
            :class="{ sel: c.template?.id === t.id, off: t.status !== 'APPROVED' }"
            :title="t.status !== 'APPROVED' ? 'Só templates aprovados podem ser disparados' : ''"
            @click="escolher(t)"
          >
            <div class="row between">
              <strong class="mono">{{ t.name }}</strong>
              <UiStatusBadge :status="t.status" kind="template" />
            </div>
            <span class="small muted">{{ CATEGORY[t.category] || t.category }} · {{ t.language }}</span>
          </button>
        </div>
      </div>
      <div class="stack">
        <span class="small muted">Pré-visualização</span>
        <WhatsappBolhaPreview v-if="c.template" :components="c.template.components" />
        <div v-else class="card card-pad muted">Escolha um template</div>
      </div>
    </div>

    <div class="row between">
      <button class="btn" @click="emit('back')">← Voltar</button>
      <button class="btn primary" :disabled="!c.template" @click="emit('next')">Continuar →</button>
    </div>
  </div>
</template>

<style scoped>
.canais { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.lista { display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto; }
.opt { text-align: left; font: inherit; background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; }
.opt:hover { border-color: #b9c9c0; }
.opt.sel { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-soft); }
.opt.off { opacity: .55; cursor: not-allowed; }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
</style>

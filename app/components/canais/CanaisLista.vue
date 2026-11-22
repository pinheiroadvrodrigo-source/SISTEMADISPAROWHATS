<script setup lang="ts">
import type { Canal } from '~/composables/useCanais'
defineProps<{ canais: Canal[]; loading: boolean }>()
const emit = defineEmits<{ changed: []; novo: [] }>()
const busy = ref<number | null>(null)
const error = ref('')

const QUALITY: Record<string, { label: string; tone: string }> = {
  GREEN: { label: 'Qualidade alta', tone: 'green' },
  YELLOW: { label: 'Qualidade média', tone: 'amber' },
  RED: { label: 'Qualidade baixa', tone: 'red' },
}

async function atualizar(c: Canal) {
  busy.value = c.id
  error.value = ''
  try {
    await api(`/api/channels/${c.id}/refresh`, { method: 'POST' })
    emit('changed')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = null
  }
}
async function excluir(c: Canal) {
  if (!confirm(`Remover o canal "${c.name}"?`)) return
  error.value = ''
  try {
    await api(`/api/channels/${c.id}`, { method: 'DELETE' })
    emit('changed')
  } catch (e) {
    error.value = errorText(e)
  }
}
</script>

<template>
  <div class="stack">
    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="!loading && !canais.length" class="card">
      <UiEmptyState title="Nenhum número conectado" text="Conecte o número da API oficial para criar templates e disparar campanhas.">
        <button class="btn primary" @click="emit('novo')">Conectar número</button>
      </UiEmptyState>
    </div>
    <div class="cards">
      <div v-for="c in canais" :key="c.id" class="card card-pad stack">
        <div class="row between">
          <div class="row">
            <span class="avatar">📱</span>
            <div>
              <h3>{{ c.name }}</h3>
              <div class="muted small">{{ c.verified_name }}</div>
            </div>
          </div>
          <UiBadge v-if="c.quality_rating" :tone="QUALITY[c.quality_rating]?.tone">{{ QUALITY[c.quality_rating]?.label || c.quality_rating }}</UiBadge>
        </div>
        <div class="phone">{{ c.display_phone }}</div>
        <div class="small muted">
          Phone ID <span class="mono">{{ c.phone_number_id }}</span> · WABA <span class="mono">{{ c.waba_id }}</span><br />
          Token terminado em <span class="mono">…{{ c.token_end }}</span>
        </div>
        <div class="row">
          <button class="btn sm" :disabled="busy === c.id" @click="atualizar(c)">{{ busy === c.id ? 'Verificando…' : 'Testar conexão' }}</button>
          <button class="btn sm danger" @click="excluir(c)">Remover</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.avatar { width: 38px; height: 38px; border-radius: 10px; background: var(--brand-soft); display: grid; place-items: center; }
.phone { font-size: 20px; font-weight: 700; letter-spacing: -.01em; }
</style>

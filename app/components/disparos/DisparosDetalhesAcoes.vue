<script setup lang="ts">
const props = defineProps<{ camp: any }>()
const emit = defineEmits<{ changed: [] }>()
const busy = ref(false)

async function acao(a: 'pause' | 'resume' | 'cancel') {
  if (a === 'cancel' && !confirm('Cancelar a campanha? As mensagens que ainda não saíram não serão enviadas.')) return
  busy.value = true
  try {
    await api(`/api/campaigns/${props.camp.id}/${a}`, { method: 'POST' })
    emit('changed')
  } catch (e) {
    alert(errorText(e))
  } finally {
    busy.value = false
  }
}
async function excluir() {
  if (!confirm('Excluir a campanha e todo o relatório?')) return
  try {
    await api(`/api/campaigns/${props.camp.id}`, { method: 'DELETE' })
    navigateTo('/disparos')
  } catch (e) {
    alert(errorText(e))
  }
}
const ativa = computed(() => ['running', 'scheduled'].includes(props.camp.status))
</script>

<template>
  <div class="row wrap">
    <button v-if="ativa" class="btn" :disabled="busy" @click="acao('pause')">⏸ Pausar</button>
    <button v-if="camp.status === 'paused'" class="btn primary" :disabled="busy" @click="acao('resume')">▶ Retomar</button>
    <button v-if="ativa || camp.status === 'paused'" class="btn danger" :disabled="busy" @click="acao('cancel')">Cancelar</button>
    <a class="btn" :href="`/api/campaigns/${camp.id}/export`">⬇ Relatório</a>
    <button v-if="!ativa" class="btn ghost danger" @click="excluir">Excluir</button>
  </div>
</template>

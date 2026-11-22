<script setup lang="ts">
const url = computed(() => (import.meta.client ? `${window.location.origin}/api/webhook` : ''))
const copied = ref(false)
async function copiar() {
  await navigator.clipboard.writeText(url.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="card card-pad stack">
    <div>
      <h2>Webhook (status de entregue e lido)</h2>
      <p class="muted small">
        No painel da Meta → seu App → WhatsApp → Configuração, cole esta URL de retorno, use o mesmo token de verificação do arquivo
        <span class="mono">.env</span> e assine o campo <span class="mono">messages</span>.
      </p>
    </div>
    <div class="row">
      <input class="mono" :value="url" readonly />
      <button class="btn" @click="copiar">{{ copied ? 'Copiado ✓' : 'Copiar' }}</button>
    </div>
  </div>
</template>

<style scoped>
p { margin: 4px 0 0; }
</style>

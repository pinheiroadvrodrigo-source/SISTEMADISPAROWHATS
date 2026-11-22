<script setup lang="ts">
const emit = defineEmits<{ saved: [] }>()
const form = reactive({ name: '', phoneNumberId: '', wabaId: '', accessToken: '' })
const error = ref('')
const loading = ref(false)

async function salvar() {
  error.value = ''
  loading.value = true
  try {
    await api('/api/channels', { method: 'POST', body: form })
    emit('saved')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="stack" @submit.prevent="salvar">
    <label class="field">Nome do canal <input v-model="form.name" placeholder="Ex.: Comercial" required /></label>
    <label class="field">
      Phone Number ID
      <input v-model="form.phoneNumberId" class="mono" placeholder="1234567890123456" required />
      <span class="hint">Meta for Developers → seu App → WhatsApp → Configuração da API</span>
    </label>
    <label class="field">
      WhatsApp Business Account ID (WABA)
      <input v-model="form.wabaId" class="mono" placeholder="1029384756123456" required />
    </label>
    <label class="field">
      Token de acesso permanente
      <input v-model="form.accessToken" class="mono" type="password" placeholder="EAAG…" required />
      <span class="hint">Crie um usuário do sistema no Gerenciador de Negócios com as permissões whatsapp_business_messaging e whatsapp_business_management.</span>
    </label>
    <div v-if="error" class="alert error">{{ error }}</div>
    <button class="btn primary" :disabled="loading">{{ loading ? 'Validando na Meta…' : 'Conectar' }}</button>
  </form>
</template>

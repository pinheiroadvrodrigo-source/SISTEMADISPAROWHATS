<script setup lang="ts">
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function entrar() {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ user: string }>('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    useState('user').value = res.user
    await navigateTo('/disparos')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wrap">
    <form class="card card-pad stack box" @submit.prevent="entrar">
      <div class="row">
        <span class="dot">W</span>
        <div>
          <h1>Disparos WhatsApp</h1>
          <p class="muted small">Entre para gerenciar suas campanhas</p>
        </div>
      </div>
      <label class="field">E-mail <input v-model="email" type="email" autocomplete="username" required /></label>
      <label class="field">Senha <input v-model="password" type="password" autocomplete="current-password" required /></label>
      <div v-if="error" class="alert error">{{ error }}</div>
      <button class="btn primary" :disabled="loading">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
    </form>
  </div>
</template>

<style scoped>
.wrap { min-height: 100vh; display: grid; place-items: center; padding: 20px; background: linear-gradient(160deg, #e8f6ee, var(--bg) 55%); }
.box { width: 100%; max-width: 380px; }
.dot { width: 40px; height: 40px; border-radius: 12px; background: var(--brand); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 18px; }
p { margin: 2px 0 0; }
</style>

<script setup lang="ts">
const links = [
  { to: '/disparos', label: 'Disparos', icon: '🚀' },
  { to: '/templates', label: 'Templates', icon: '📝' },
  { to: '/canais', label: 'Canais', icon: '📱' },
  { to: '/descadastros', label: 'Descadastros', icon: '🚫' },
]
const user = useState<string | null>('user')
async function sair() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  user.value = null
  navigateTo('/login')
}
</script>

<template>
  <aside class="side">
    <div class="logo">
      <span class="dot">W</span>
      <div>
        <strong>Disparos</strong>
        <div class="small muted">API oficial WhatsApp</div>
      </div>
    </div>
    <nav>
      <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="link">
        <span>{{ l.icon }}</span>{{ l.label }}
      </NuxtLink>
    </nav>
    <div class="foot">
      <div class="small muted ellipsis">{{ user }}</div>
      <button class="btn ghost sm" @click="sair">Sair</button>
    </div>
  </aside>
</template>

<style scoped>
.side { width: 230px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--line); padding: 20px 14px; display: flex; flex-direction: column; gap: 22px; position: sticky; top: 0; height: 100vh; }
.logo { display: flex; gap: 10px; align-items: center; padding: 0 6px; }
.dot { width: 34px; height: 34px; border-radius: 10px; background: var(--brand); color: #fff; display: grid; place-items: center; font-weight: 800; }
nav { display: flex; flex-direction: column; gap: 2px; }
.link { display: flex; gap: 10px; align-items: center; padding: 9px 10px; border-radius: 9px; font-weight: 600; color: var(--muted); }
.link:hover { background: var(--bg); color: var(--ink); }
.link.router-link-active { background: var(--brand-soft); color: var(--brand-2); }
.foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 0 6px; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 760px) {
  .side { width: 100%; height: auto; position: static; flex-direction: row; align-items: center; padding: 10px; gap: 10px; overflow-x: auto; }
  .logo div, .foot .muted { display: none; }
  nav { flex-direction: row; }
  .foot { margin: 0; }
}
</style>

<script setup lang="ts">
defineProps<{ title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="card modal" :class="{ wide }">
        <header class="row between">
          <h2>{{ title }}</h2>
          <button class="btn ghost sm" aria-label="Fechar" @click="emit('close')">✕</button>
        </header>
        <div class="body"><slot /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(12, 20, 16, .45); display: grid; place-items: center; padding: 20px; z-index: 50; }
.modal { width: 100%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; }
.modal.wide { max-width: 980px; }
header { padding: 16px 20px; border-bottom: 1px solid var(--line); }
.body { padding: 20px; overflow-y: auto; }
</style>

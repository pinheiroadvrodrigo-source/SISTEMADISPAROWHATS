<script setup lang="ts">
defineProps<{ title: string; text?: string }>()
</script>

<template>
  <div class="empty">
    <div class="icon">💬</div>
    <h2>{{ title }}</h2>
    <p v-if="text" class="muted">{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty { text-align: center; padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.icon { font-size: 34px; }
p { margin: 0 0 8px; max-width: 420px; }
</style>

<script setup lang="ts">
defineProps<{ label: string; value: number | string; hint?: string; tone?: string }>()
</script>

<template>
  <div class="card stat" :class="tone">
    <span class="muted small">{{ label }}</span>
    <strong>{{ typeof value === 'number' ? value.toLocaleString('pt-BR') : value }}</strong>
    <span v-if="hint" class="small muted">{{ hint }}</span>
  </div>
</template>

<style scoped>
.stat { padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; border-top: 3px solid var(--line); }
.stat strong { font-size: 26px; letter-spacing: -.02em; }
.green { border-top-color: var(--brand); }
.teal { border-top-color: #14b8a6; }
.blue { border-top-color: var(--blue); }
.red { border-top-color: var(--red); }
.amber { border-top-color: #f59e0b; }
</style>

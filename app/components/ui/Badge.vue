<script setup lang="ts">
defineProps<{ tone?: string }>()
</script>

<template>
  <span class="badge" :class="tone || 'gray'"><slot /></span>
</template>

<style scoped>
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.green { background: var(--brand-soft); color: var(--brand-2); }
.teal { background: #dff6f5; color: #0f766e; }
.blue { background: var(--blue-soft); color: var(--blue); }
.amber { background: var(--amber-soft); color: var(--amber); }
.red { background: var(--red-soft); color: var(--red); }
.gray { background: var(--gray-soft); color: var(--muted); }
</style>

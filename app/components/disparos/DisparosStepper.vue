<script setup lang="ts">
defineProps<{ steps: string[]; current: number }>()
const emit = defineEmits<{ go: [i: number] }>()
</script>

<template>
  <ol class="stepper">
    <li v-for="(s, i) in steps" :key="s" :class="{ done: i < current, active: i === current }" @click="i < current && emit('go', i)">
      <span class="n">{{ i < current ? '✓' : i + 1 }}</span>
      <span class="l">{{ s }}</span>
    </li>
  </ol>
</template>

<style scoped>
.stepper { list-style: none; margin: 0 0 20px; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
li { flex: 1; min-width: 140px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid var(--line); color: var(--muted); font-weight: 600; }
li.done { cursor: pointer; color: var(--brand-2); }
li.active { border-color: var(--brand); color: var(--ink); box-shadow: 0 0 0 3px var(--brand-soft); }
.n { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--gray-soft); font-size: 12px; }
.done .n { background: var(--brand-soft); }
.active .n { background: var(--brand); color: #fff; }
</style>

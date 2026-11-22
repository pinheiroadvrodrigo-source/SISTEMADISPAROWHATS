<script setup lang="ts">
const props = defineProps<{ status: string; kind: 'campaign' | 'message' | 'template' }>()
const info = computed(() => {
  const map = props.kind === 'campaign' ? CAMPAIGN_STATUS : props.kind === 'message' ? MESSAGE_STATUS : TEMPLATE_STATUS
  return map[props.status] || { label: props.status, tone: 'gray' }
})
</script>

<template>
  <UiBadge :tone="info.tone">{{ info.label }}</UiBadge>
</template>

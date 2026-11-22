<script setup lang="ts">
const { canais, loading, load } = useCanais()
const showForm = ref(false)
onMounted(load)
</script>

<template>
  <div>
    <UiPageHeader title="Canais" subtitle="Números conectados pela API oficial do WhatsApp (Cloud API da Meta)">
      <button class="btn primary" @click="showForm = true">+ Conectar número</button>
    </UiPageHeader>
    <div class="stack">
      <CanaisWebhookInfo />
      <CanaisLista :canais="canais" :loading="loading" @changed="load" @novo="showForm = true" />
    </div>
    <UiModal v-if="showForm" title="Conectar número da API oficial" @close="showForm = false">
      <CanaisForm @saved="showForm = false; load()" />
    </UiModal>
  </div>
</template>

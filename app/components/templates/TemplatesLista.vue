<script setup lang="ts">
defineProps<{ templates: any[]; loading: boolean }>()
const aberto = ref<any | null>(null)
</script>

<template>
  <div class="card">
    <div v-if="loading" class="card-pad muted">Buscando templates na Meta…</div>
    <UiEmptyState v-else-if="!templates.length" title="Nenhum template ainda" text="Crie o primeiro template. A Meta costuma aprovar em poucos minutos." />
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>Nome</th><th>Categoria</th><th>Idioma</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="t in templates" :key="t.id" class="clickable" @click="aberto = t">
            <td><strong class="mono">{{ t.name }}</strong></td>
            <td>{{ CATEGORY[t.category] || t.category }}</td>
            <td>{{ t.language }}</td>
            <td><UiStatusBadge :status="t.status" kind="template" /></td>
            <td class="muted small">Ver ›</td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiModal v-if="aberto" :title="aberto.name" @close="aberto = null">
      <WhatsappBolhaPreview :components="aberto.components" />
    </UiModal>
  </div>
</template>

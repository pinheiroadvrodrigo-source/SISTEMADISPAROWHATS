<script setup lang="ts">
defineProps<{ campanhas: any[]; loading: boolean }>()
</script>

<template>
  <div class="card">
    <div v-if="loading" class="card-pad muted">Carregando…</div>
    <UiEmptyState v-else-if="!campanhas.length" title="Nenhuma campanha ainda" text="Suba uma planilha, escolha um template aprovado e dispare para seus contatos.">
      <NuxtLink to="/disparos/nova" class="btn primary">Criar primeira campanha</NuxtLink>
    </UiEmptyState>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>Campanha</th><th>Status</th><th>Progresso</th><th>Entregues</th><th>Lidos</th><th>Falhas</th><th>Data</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in campanhas" :key="c.id" class="clickable" @click="navigateTo(`/disparos/${c.id}`)">
            <td>
              <strong>{{ c.name }}</strong>
              <div class="small muted">{{ c.template_name }} · {{ c.channel_name }}</div>
            </td>
            <td><UiStatusBadge :status="c.status" kind="campaign" /></td>
            <td class="prog">
              <div class="progress"><div :style="{ width: pct((c.sent || 0) + (c.failed || 0), c.total).replace(',', '.') }" /></div>
              <span class="small muted">{{ ((c.sent || 0) + (c.failed || 0)).toLocaleString('pt-BR') }} / {{ c.total.toLocaleString('pt-BR') }}</span>
            </td>
            <td>{{ (c.delivered || 0).toLocaleString('pt-BR') }} <span class="small muted">{{ pct(c.delivered || 0, c.total) }}</span></td>
            <td>{{ (c.read || 0).toLocaleString('pt-BR') }} <span class="small muted">{{ pct(c.read || 0, c.total) }}</span></td>
            <td :class="{ red: c.failed }">{{ (c.failed || 0).toLocaleString('pt-BR') }}</td>
            <td class="small muted">{{ c.status === 'scheduled' ? 'Agendada p/ ' + fmtDate(c.scheduled_at) : fmtDate(c.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.prog { min-width: 150px; }
.prog .progress { margin-bottom: 4px; }
.red { color: var(--red); font-weight: 600; }
</style>

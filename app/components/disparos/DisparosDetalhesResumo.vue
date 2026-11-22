<script setup lang="ts">
const props = defineProps<{ camp: any }>()
const s = computed(() => props.camp.stats)
const processados = computed(() => s.value.sent + s.value.failed + s.value.canceled)
</script>

<template>
  <div class="stack">
    <div class="cards">
      <UiStatCard label="Total" :value="s.total" :hint="s.pending ? `${s.pending.toLocaleString('pt-BR')} na fila` : 'Fila concluída'" />
      <UiStatCard label="Enviados" :value="s.sent" :hint="pct(s.sent, s.total)" tone="blue" />
      <UiStatCard label="Entregues" :value="s.delivered" :hint="pct(s.delivered, s.total)" tone="green" />
      <UiStatCard label="Lidos" :value="s.read" :hint="`${pct(s.read, s.delivered)} dos entregues`" tone="teal" />
      <UiStatCard label="Falhas" :value="s.failed" :hint="pct(s.failed, s.total)" tone="red" />
    </div>
    <div class="card card-pad">
      <div class="row between small">
        <strong>Progresso do disparo</strong>
        <span class="muted">{{ processados.toLocaleString('pt-BR') }} de {{ s.total.toLocaleString('pt-BR') }} · {{ camp.rate_per_second }} msg/s</span>
      </div>
      <div class="bar">
        <div class="read" :style="{ width: (s.read / (s.total || 1)) * 100 + '%' }" />
        <div class="deliv" :style="{ width: ((s.delivered - s.read) / (s.total || 1)) * 100 + '%' }" />
        <div class="sent" :style="{ width: ((s.sent - s.delivered) / (s.total || 1)) * 100 + '%' }" />
        <div class="fail" :style="{ width: (s.failed / (s.total || 1)) * 100 + '%' }" />
      </div>
      <div class="legend small muted">
        <span><i class="read" />Lido</span><span><i class="deliv" />Entregue</span><span><i class="sent" />Enviado</span><span><i class="fail" />Falha</span>
        <span class="grow" />
        <span>Início {{ fmtDate(camp.started_at) }}</span><span v-if="camp.finished_at">Fim {{ fmtDate(camp.finished_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
@media (max-width: 900px) { .cards { grid-template-columns: repeat(2, 1fr); } }
.bar { display: flex; height: 12px; border-radius: 99px; background: var(--gray-soft); overflow: hidden; margin: 12px 0 10px; }
.bar div { transition: width .5s; }
.read { background: #14b8a6; }
.deliv { background: var(--brand); }
.sent { background: var(--blue); }
.fail { background: var(--red); }
.legend { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.legend i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 5px; }
</style>

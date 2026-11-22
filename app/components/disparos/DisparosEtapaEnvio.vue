<script setup lang="ts">
import { normalizePhone } from '#shared/template'

const emit = defineEmits<{ back: [] }>()
const { c } = useNovaCampanha()
const { canais } = useCanais()
const error = ref('')
const loading = ref(false)

const canal = computed(() => canais.value.find(x => x.id === c.value.channelId))
const total = computed(() => new Set(c.value.rows.map(r => normalizePhone(r[c.value.phoneColumn])).filter(Boolean)).size)
const duracao = computed(() => {
  const s = Math.ceil(total.value / c.value.ratePerSecond)
  if (s < 60) return `${s} segundos`
  if (s < 3600) return `${Math.ceil(s / 60)} minutos`
  return `${(s / 3600).toFixed(1).replace('.', ',')} horas`
})
const minLocal = computed(() => {
  const d = new Date(Date.now() + 5 * 60000)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
})

async function disparar() {
  error.value = ''
  if (c.value.when === 'later' && !c.value.scheduledLocal) return (error.value = 'Escolha a data e a hora')
  loading.value = true
  try {
    const res: any = await api('/api/campaigns', {
      method: 'POST',
      body: {
        name: c.value.name,
        channelId: c.value.channelId,
        template: c.value.template,
        mapping: c.value.mapping,
        headerMediaUrl: c.value.headerMediaUrl,
        rows: c.value.rows,
        phoneColumn: c.value.phoneColumn,
        nameColumn: c.value.nameColumn,
        ratePerSecond: c.value.ratePerSecond,
        scheduledAt: c.value.when === 'later' ? new Date(c.value.scheduledLocal).toISOString() : null,
      },
    })
    await navigateTo({ path: `/disparos/${res.id}`, query: { novo: '1', inv: res.invalid, dup: res.duplicates, opt: res.optedOut } })
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div class="grid-2">
      <div class="card card-pad stack">
        <h2>Quando enviar</h2>
        <div class="opts">
          <label class="opt" :class="{ sel: c.when === 'now' }"><input v-model="c.when" type="radio" value="now" /> <div><strong>Enviar agora</strong><span class="small muted">Começa assim que você confirmar</span></div></label>
          <label class="opt" :class="{ sel: c.when === 'later' }"><input v-model="c.when" type="radio" value="later" /> <div><strong>Agendar</strong><span class="small muted">Escolha dia e horário</span></div></label>
        </div>
        <label v-if="c.when === 'later'" class="field">Data e hora <input v-model="c.scheduledLocal" type="datetime-local" :min="minLocal" /></label>
        <label class="field">
          Velocidade
          <select v-model.number="c.ratePerSecond">
            <option :value="1">1 mensagem/segundo (bem cauteloso)</option>
            <option :value="5">5 mensagens/segundo</option>
            <option :value="10">10 mensagens/segundo</option>
            <option :value="20">20 mensagens/segundo (recomendado)</option>
            <option :value="40">40 mensagens/segundo</option>
            <option :value="80">80 mensagens/segundo (máximo da Cloud API)</option>
          </select>
          <span class="hint">Tempo estimado: {{ duracao }}. Você pode pausar a qualquer momento.</span>
        </label>
      </div>

      <div class="card card-pad stack">
        <h2>Resumo</h2>
        <dl>
          <dt>Campanha</dt><dd>{{ c.name }}</dd>
          <dt>Contatos</dt><dd>{{ total.toLocaleString('pt-BR') }} números únicos</dd>
          <dt>Número</dt><dd>{{ canal?.name }} · {{ canal?.display_phone }}</dd>
          <dt>Template</dt><dd class="mono">{{ c.template?.name }}</dd>
          <dt>Categoria</dt><dd>{{ CATEGORY[c.template?.category || ''] || c.template?.category }}</dd>
        </dl>
        <div class="alert info small">
          A Meta cobra por conversa iniciada conforme a categoria do template, e só entrega para quem aceitou receber suas mensagens.
          Contatos que responderem SAIR são descadastrados automaticamente.
        </div>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div class="row between">
      <button class="btn" @click="emit('back')">← Voltar</button>
      <button class="btn primary big" :disabled="loading" @click="disparar">
        {{ loading ? 'Criando campanha…' : c.when === 'later' ? '📅 Agendar disparo' : '🚀 Iniciar disparo' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.opts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.opt { display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--line); border-radius: 10px; padding: 12px; cursor: pointer; }
.opt input { width: auto; margin-top: 3px; }
.opt div { display: flex; flex-direction: column; }
.opt.sel { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-soft); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; margin: 0; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 600; }
.big { padding: 11px 22px; font-size: 15px; }
</style>

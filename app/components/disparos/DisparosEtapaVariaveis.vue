<script setup lang="ts">
import { templateSlots, previewValues, headerMediaFormat, normalizePhone } from '#shared/template'

const emit = defineEmits<{ next: []; back: [] }>()
const { c } = useNovaCampanha()
const tpl = computed(() => c.value.template!)
const slots = computed(() => templateSlots(tpl.value))
const media = computed(() => headerMediaFormat(tpl.value))
const idx = ref(0)

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

// Liga automaticamente {{nome}} à coluna "Nome", etc.
for (const s of slots.value) {
  if (c.value.mapping[s.key]) continue
  const col = c.value.columns.find(k => norm(k) === norm(s.variable)) || (s.variable === '1' && !s.key.startsWith('button') && c.value.nameColumn) || ''
  c.value.mapping[s.key] = { column: col, value: '' }
}

const row = computed(() => c.value.rows[idx.value] || {})
const values = computed(() => previewValues(tpl.value, c.value.mapping, row.value))
const vazias = computed(() => slots.value.filter(s => !c.value.mapping[s.key]?.column && !c.value.mapping[s.key]?.value?.trim()))
const linhasVazias = computed(() => {
  // contatos em que alguma variável sem valor padrão ficaria vazia
  let n = 0
  for (const r of c.value.rows) {
    const v = previewValues(tpl.value, c.value.mapping, r)
    if (slots.value.some(s => !v[s.key])) n++
  }
  return n
})
const mediaOk = computed(() => !media.value || /^https:\/\/.+/.test(c.value.headerMediaUrl))
</script>

<template>
  <div class="stack">
    <div class="grid">
      <div class="card card-pad stack">
        <h2>Preencher variáveis</h2>
        <p v-if="!slots.length && !media" class="muted">Este template não tem variáveis. Pode avançar.</p>
        <div v-for="s in slots" :key="s.key" class="slot">
          <strong>{{ s.label }}</strong>
          <div class="grid-2">
            <label class="field">
              <span class="hint">Coluna da planilha</span>
              <select v-model="c.mapping[s.key]!.column">
                <option value="">— Texto fixo —</option>
                <option v-for="col in c.columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </label>
            <label class="field">
              <span class="hint">{{ c.mapping[s.key]?.column ? 'Se a célula estiver vazia, usar' : 'Texto para todos' }}</span>
              <input v-model="c.mapping[s.key]!.value" :placeholder="c.mapping[s.key]?.column ? 'Ex.: cliente' : ''" />
            </label>
          </div>
        </div>
        <label v-if="media" class="field">
          Link da mídia do cabeçalho ({{ media === 'IMAGE' ? 'imagem' : media === 'VIDEO' ? 'vídeo' : 'documento' }})
          <input v-model="c.headerMediaUrl" placeholder="https://seusite.com/arquivo.jpg" />
          <span class="hint">Precisa ser um link público https</span>
        </label>
        <div v-if="linhasVazias && !vazias.length" class="alert warn">
          {{ linhasVazias }} contato(s) têm células vazias e vão falhar. Preencha o campo "Se a célula estiver vazia" para evitar.
        </div>
      </div>

      <div class="stack">
        <div class="row between">
          <span class="small muted">Preview: contato {{ idx + 1 }} de {{ c.rows.length.toLocaleString('pt-BR') }}</span>
          <div class="row">
            <button class="btn sm" :disabled="idx === 0" @click="idx--">‹</button>
            <button class="btn sm" :disabled="idx >= c.rows.length - 1" @click="idx++">›</button>
          </div>
        </div>
        <WhatsappBolhaPreview :components="tpl.components" :values="values" :media-url="c.headerMediaUrl" />
        <span class="small muted">Para: {{ fmtPhone(normalizePhone(row[c.phoneColumn])) || `${row[c.phoneColumn]} (inválido)` }}</span>
      </div>
    </div>

    <div class="row between">
      <button class="btn" @click="emit('back')">← Voltar</button>
      <button class="btn primary" :disabled="!!vazias.length || !mediaOk" @click="emit('next')">Continuar →</button>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; align-items: start; }
.slot { display: flex; flex-direction: column; gap: 8px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
p { margin: 0; }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
</style>

<script setup lang="ts">
import { guessPhoneColumn, normalizePhone } from '#shared/template'

const emit = defineEmits<{ next: [] }>()
const { c } = useNovaCampanha()
const error = ref('')
const loading = ref(false)
const dragging = ref(false)
const input = ref<HTMLInputElement>()

async function ler(file?: File | null) {
  if (!file) return
  error.value = ''
  loading.value = true
  try {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    let wb
    if (/\.(csv|txt)$/i.test(file.name)) {
      // CSV: tenta UTF-8 e cai para Windows-1252 (padrão do Excel no Brasil) para não estragar acentos
      let text: string
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buf)
      } catch {
        text = new TextDecoder('windows-1252').decode(buf)
      }
      wb = XLSX.read(text.replace(/^\uFEFF/, ''), { type: 'string', raw: true })
    } else {
      wb = XLSX.read(buf, { type: 'array' })
    }
    const sheet = wb.Sheets[wb.SheetNames[0]!]!
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true })
    const rows = raw
      .map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k).trim(), typeof v === 'number' ? String(v) : String(v ?? '').trim()])))
      .filter(r => Object.values(r).some(v => v))
    if (!rows.length) throw new Error('A planilha está vazia')
    const columns = Object.keys(rows[0]!).filter(k => !k.startsWith('__EMPTY'))
    c.value.rows = rows
    c.value.columns = columns
    c.value.fileName = file.name
    c.value.phoneColumn = guessPhoneColumn(columns, rows) || ''
    c.value.nameColumn = columns.find(k => /^(nome|name|cliente|primeiro)/i.test(k)) || ''
    c.value.mapping = {}
  } catch (e: any) {
    error.value = `Não consegui ler o arquivo: ${e.message}`
  } finally {
    loading.value = false
    if (input.value) input.value.value = ''
  }
}
function onDrop(e: DragEvent) {
  dragging.value = false
  ler(e.dataTransfer?.files?.[0])
}
function baixarModelo() {
  const csv = '﻿nome;telefone;cidade\nIsrael;(91) 99999-0000;Belém\nMaria;5591988887777;Ananindeua\n'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'modelo-contatos.csv'
  a.click()
}

const validos = computed(() => {
  if (!c.value.phoneColumn) return 0
  const set = new Set(c.value.rows.map(r => normalizePhone(r[c.value.phoneColumn])).filter(Boolean))
  return set.size
})
const pode = computed(() => c.value.name.trim() && c.value.rows.length && c.value.phoneColumn && validos.value)
</script>

<template>
  <div class="card card-pad stack">
    <label class="field">Nome da campanha <input v-model="c.name" placeholder="Ex.: Promoção de Páscoa" /></label>

    <div
      class="drop"
      :class="{ dragging }"
      @click="input?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <input ref="input" type="file" accept=".xlsx,.xls,.csv,.ods" hidden @change="ler(($event.target as HTMLInputElement).files?.[0])" />
      <div class="big">📊</div>
      <strong>{{ loading ? 'Lendo planilha…' : c.fileName || 'Clique ou arraste sua planilha aqui' }}</strong>
      <span class="small muted">Excel (.xlsx, .xls) ou CSV · a primeira linha deve ter os nomes das colunas</span>
    </div>
    <button class="btn sm ghost link" @click="baixarModelo">Baixar planilha modelo</button>
    <div v-if="error" class="alert error">{{ error }}</div>

    <template v-if="c.rows.length">
      <div class="grid-2">
        <label class="field">
          Coluna do telefone
          <select v-model="c.phoneColumn">
            <option value="">Selecione…</option>
            <option v-for="col in c.columns" :key="col" :value="col">{{ col }}</option>
          </select>
          <span class="hint">Números sem 55 recebem o código do Brasil automaticamente</span>
        </label>
        <label class="field">
          Coluna do nome (opcional)
          <select v-model="c.nameColumn">
            <option value="">Nenhuma</option>
            <option v-for="col in c.columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </label>
      </div>
      <div class="alert" :class="validos ? 'ok' : 'warn'">
        {{ c.rows.length.toLocaleString('pt-BR') }} linhas · <strong>{{ validos.toLocaleString('pt-BR') }} telefones válidos e únicos</strong>
      </div>
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th v-for="col in c.columns" :key="col">{{ col }} <span v-if="col === c.phoneColumn">📞</span></th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in c.rows.slice(0, 5)" :key="i">
              <td v-for="col in c.columns" :key="col">{{ r[col] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <span v-if="c.rows.length > 5" class="small muted">Mostrando 5 de {{ c.rows.length.toLocaleString('pt-BR') }} linhas</span>
    </template>

    <div class="row" style="justify-content: flex-end">
      <button class="btn primary" :disabled="!pode" @click="emit('next')">Avançar →</button>
    </div>
  </div>
</template>

<style scoped>
.drop { border: 2px dashed var(--line); border-radius: 12px; padding: 34px 20px; text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center; cursor: pointer; transition: .15s; }
.drop:hover, .drop.dragging { border-color: var(--brand); background: var(--brand-soft); }
.big { font-size: 32px; }
.link { align-self: flex-start; color: var(--brand-2); padding-left: 0; }
</style>

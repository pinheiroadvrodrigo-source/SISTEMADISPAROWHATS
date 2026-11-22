<script setup lang="ts">
import { extractVars } from '#shared/template'

const props = defineProps<{ canalId: number }>()
const emit = defineEmits<{ saved: [] }>()

const form = reactive({
  name: '',
  category: 'MARKETING',
  language: 'pt_BR',
  headerType: 'NONE',
  headerText: '',
  body: 'Olá {{nome}}, conheça a nossa nova promoção!',
  footer: '',
  buttons: [] as { type: string; text: string; url?: string; phone?: string; example?: string }[],
  examples: {} as Record<string, string>,
})
const tag = (v: string) => '{' + '{' + v + '}' + '}'
const error = ref('')
const ok = ref('')
const loading = ref(false)
const bodyEl = ref<HTMLTextAreaElement>()

const vars = computed(() => [...new Set([...(form.headerType === 'TEXT' ? extractVars(form.headerText) : []), ...extractVars(form.body)])])

// Monta os componentes no mesmo formato da Meta para o preview
const components = computed(() => {
  const c: any[] = []
  if (form.headerType === 'TEXT' && form.headerText) c.push({ type: 'HEADER', format: 'TEXT', text: form.headerText })
  c.push({ type: 'BODY', text: form.body })
  if (form.footer) c.push({ type: 'FOOTER', text: form.footer })
  if (form.buttons.length) c.push({ type: 'BUTTONS', buttons: form.buttons.map(b => ({ type: b.type, text: b.text || 'Botão' })) })
  return c
})
const previewValues = computed(() => {
  const out: Record<string, string> = {}
  for (const v of vars.value) out[`body:${v}`] = out[`header:${v}`] = form.examples[v] || ''
  return out
})

function inserirVariavel() {
  const nome = prompt('Nome da variável (ex.: nome, cupom, cidade)')?.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  if (!nome) return
  const el = bodyEl.value
  const tag = `{{${nome}}}`
  if (el) {
    const s = el.selectionStart
    form.body = form.body.slice(0, s) + tag + form.body.slice(el.selectionEnd)
    nextTick(() => { el.focus(); el.selectionStart = el.selectionEnd = s + tag.length })
  } else form.body += tag
}
function addBotao(type: string) {
  if (form.buttons.length >= 10) return
  form.buttons.push({ type, text: '', url: type === 'URL' ? 'https://' : undefined, phone: type === 'PHONE_NUMBER' ? '55' : undefined })
}

async function salvar() {
  error.value = ''
  ok.value = ''
  loading.value = true
  try {
    const res: any = await api(`/api/channels/${props.canalId}/templates`, { method: 'POST', body: form })
    ok.value = `Template enviado para a Meta. Status: ${TEMPLATE_STATUS[res.status]?.label || res.status}.`
    setTimeout(() => emit('saved'), 1200)
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid">
    <form class="stack" @submit.prevent="salvar">
      <div class="grid-2">
        <label class="field">
          Nome
          <input v-model="form.name" placeholder="promocao_pascoa" required />
          <span class="hint">Letras minúsculas e _ (ajustamos automaticamente)</span>
        </label>
        <label class="field">
          Categoria
          <select v-model="form.category">
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utilidade</option>
            <option value="AUTHENTICATION">Autenticação</option>
          </select>
        </label>
      </div>
      <div class="grid-2">
        <label class="field">
          Idioma
          <select v-model="form.language">
            <option value="pt_BR">Português (BR)</option>
            <option value="en_US">Inglês (EUA)</option>
            <option value="es">Espanhol</option>
          </select>
        </label>
        <label class="field">
          Cabeçalho
          <select v-model="form.headerType">
            <option value="NONE">Sem cabeçalho</option>
            <option value="TEXT">Texto</option>
          </select>
          <span class="hint">Cabeçalho com imagem/vídeo: crie no WhatsApp Manager — ele aparece aqui para disparo.</span>
        </label>
      </div>
      <label v-if="form.headerType === 'TEXT'" class="field">Texto do cabeçalho <input v-model="form.headerText" maxlength="60" /></label>
      <label class="field">
        <span class="row between">Corpo da mensagem <button type="button" class="btn sm" @click="inserirVariavel">+ Variável</button></span>
        <textarea ref="bodyEl" v-model="form.body" maxlength="1024" />
        <span class="hint">Use *negrito*, _itálico_ e variáveis como <span v-pre>{{nome}}</span>. {{ form.body.length }}/1024</span>
      </label>
      <div v-if="vars.length" class="vars stack">
        <span class="small muted">Exemplos das variáveis (a Meta exige para aprovar)</span>
        <label v-for="v in vars" :key="v" class="field">
          <span class="mono">{{ tag(v) }}</span>
          <input v-model="form.examples[v]" :placeholder="v === 'nome' ? 'Israel' : 'exemplo'" />
        </label>
      </div>
      <label class="field">Rodapé (opcional) <input v-model="form.footer" maxlength="60" placeholder="Responda SAIR para não receber mais" /></label>

      <div class="stack">
        <div class="row between">
          <strong>Botões</strong>
          <div class="row">
            <button type="button" class="btn sm" @click="addBotao('QUICK_REPLY')">Resposta rápida</button>
            <button type="button" class="btn sm" @click="addBotao('URL')">Link</button>
            <button type="button" class="btn sm" @click="addBotao('PHONE_NUMBER')">Ligar</button>
          </div>
        </div>
        <div v-for="(b, i) in form.buttons" :key="i" class="btn-row">
          <input v-model="b.text" maxlength="25" placeholder="Texto do botão" />
          <input v-if="b.type === 'URL'" v-model="b.url" placeholder="https://site.com/{{1}}" />
          <input v-if="b.type === 'URL' && b.url?.includes('{{1}}')" v-model="b.example" placeholder="Link de exemplo" />
          <input v-if="b.type === 'PHONE_NUMBER'" v-model="b.phone" placeholder="5591999999999" />
          <button type="button" class="btn ghost sm" @click="form.buttons.splice(i, 1)">✕</button>
        </div>
      </div>

      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="ok" class="alert ok">{{ ok }}</div>
      <button class="btn primary" :disabled="loading">{{ loading ? 'Enviando para a Meta…' : 'Criar template' }}</button>
    </form>
    <div class="preview">
      <span class="small muted">Pré-visualização</span>
      <WhatsappBolhaPreview :components="components" :values="previewValues" />
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
.preview { position: sticky; top: 0; align-self: start; display: flex; flex-direction: column; gap: 8px; }
.vars { background: var(--bg); padding: 12px; border-radius: 10px; }
.btn-row { display: flex; gap: 8px; }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } .preview { position: static; } }
</style>

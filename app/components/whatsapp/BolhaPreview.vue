<script setup lang="ts">
// Mostra a mensagem do template como ela chega no WhatsApp
import { fillText, getComp, type TplComponent } from '#shared/template'

const props = defineProps<{ components: TplComponent[]; values?: Record<string, string>; mediaUrl?: string | null }>()
const v = computed(() => props.values || {})
const header = computed(() => getComp(props, 'HEADER'))
const body = computed(() => getComp(props, 'BODY'))
const footer = computed(() => getComp(props, 'FOOTER'))
const buttons = computed(() => getComp(props, 'BUTTONS')?.buttons || [])

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
// Formatação do WhatsApp: *negrito*, _itálico_, ~riscado~, ```mono```
function wa(s: string) {
  return esc(s)
    .replace(/```([^`]+)```/g, '<code>$1</code>')
    .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
    .replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, '$1<i>$2</i>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/\{\{\s*(\w+)\s*\}\}/g, '<mark>{{$1}}</mark>')
    .replace(/\n/g, '<br>')
}
const headerText = computed(() => fillText(header.value?.text, 'header:', v.value))
const bodyHtml = computed(() => wa(fillText(body.value?.text, 'body:', v.value)))
const icon: Record<string, string> = { URL: '↗', PHONE_NUMBER: '📞', QUICK_REPLY: '↩' }
const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="chat">
    <div class="bubble">
      <template v-if="header">
        <div v-if="String(header.format).toUpperCase() === 'TEXT'" class="h">{{ headerText }}</div>
        <div v-else class="media">
          <img v-if="String(header.format).toUpperCase() === 'IMAGE' && mediaUrl" :src="mediaUrl" alt="" />
          <span v-else>{{ { IMAGE: '🖼️ Imagem', VIDEO: '🎬 Vídeo', DOCUMENT: '📄 Documento', LOCATION: '📍 Localização' }[String(header.format).toUpperCase()] }}</span>
        </div>
      </template>
      <div class="b" v-html="bodyHtml || '<span class=ph>Sua mensagem aparece aqui</span>'" />
      <div v-if="footer?.text" class="f">{{ footer.text }}</div>
      <div class="t">{{ now }}</div>
    </div>
    <div v-for="(b, i) in buttons" :key="i" class="btn-wa">{{ icon[b.type] || '' }} {{ b.text }}</div>
  </div>
</template>

<style scoped>
.chat { background: #efe7dd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23d8cfc4'/%3E%3C/svg%3E"); border-radius: 12px; padding: 18px 16px; min-height: 160px; }
.bubble { background: #fff; border-radius: 0 10px 10px 10px; padding: 7px 9px 6px; max-width: 330px; box-shadow: 0 1px .5px rgba(0,0,0,.13); position: relative; font-size: 14px; }
.h { font-weight: 700; margin-bottom: 4px; }
.media { background: #dfe5e7; border-radius: 7px; height: 140px; display: grid; place-items: center; color: #54656f; margin-bottom: 6px; overflow: hidden; }
.media img { width: 100%; height: 100%; object-fit: cover; }
.b { white-space: normal; word-wrap: break-word; color: #111b21; }
.b :deep(mark) { background: #fff3c4; border-radius: 3px; padding: 0 2px; }
.b :deep(.ph) { color: #8696a0; }
.f { color: #8696a0; font-size: 12.5px; margin-top: 4px; }
.t { text-align: right; color: #8696a0; font-size: 11px; margin-top: 2px; }
.btn-wa { background: #fff; max-width: 330px; margin-top: 3px; border-radius: 8px; text-align: center; color: #00a5f4; padding: 8px; font-weight: 500; box-shadow: 0 1px .5px rgba(0,0,0,.13); }
</style>

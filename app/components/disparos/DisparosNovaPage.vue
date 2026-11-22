<script setup lang="ts">
const { c, reset } = useNovaCampanha()
const steps = ['Contatos', 'Canal e template', 'Variáveis', 'Envio']
const step = ref(0)
onMounted(reset)
</script>

<template>
  <div>
    <UiPageHeader title="Nova campanha" subtitle="Disparo em massa com template aprovado pela Meta">
      <NuxtLink to="/disparos" class="btn">Cancelar</NuxtLink>
    </UiPageHeader>
    <DisparosStepper :steps="steps" :current="step" @go="step = $event" />
    <DisparosEtapaUpload v-if="step === 0" @next="step = 1" />
    <DisparosEtapaCanal v-else-if="step === 1" @back="step = 0" @next="step = 2" />
    <DisparosEtapaVariaveis v-else-if="step === 2 && c.template" @back="step = 1" @next="step = 3" />
    <DisparosEtapaEnvio v-else-if="step === 3" @back="step = 2" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <DisparosDetalhesPage :id="Number(route.params.id)" />
</template>

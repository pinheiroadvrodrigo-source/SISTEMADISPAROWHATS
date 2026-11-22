<template>
  <div class="shell">
    <LayoutSidebar />
    <main class="content"><slot /></main>
  </div>
</template>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.content { flex: 1; min-width: 0; padding: 28px 32px 60px; max-width: 1200px; }
@media (max-width: 760px) { .shell { flex-direction: column; } .content { padding: 18px 14px 50px; } }
</style>

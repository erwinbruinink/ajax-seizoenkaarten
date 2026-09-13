<script setup lang="ts">
const { session } = useAuth()
const { refresh } = useMatches()

if (session.value?.role === 'ADMIN') {
  await refresh()
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="font-extrabold text-2xl mb-6">Beheerpaneel</h1>
    <AdminPanel v-if="session?.role === 'ADMIN'" />
    <SeatModal />
  </div>
</template>

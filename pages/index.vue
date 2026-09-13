<script setup lang="ts">
const { session } = useAuth()
const { matches, nextMatch, refresh } = useMatches()

if (session.value) {
  await refresh()
}

watch(session, async (s) => {
  if (s) await refresh()
})
</script>

<template>
  <div>
    <LoginScreen v-if="!session" />
    <div v-else class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <NextMatchHero v-if="nextMatch" :match="nextMatch" />

      <ResaleAlert :matches="matches" />

      <StatsDashboard />

      <div>
        <h2 class="font-extrabold text-lg mb-3">Speelschema &amp; stoelbezetting</h2>
        <MatchTimeline :matches="matches" />
      </div>

      <SeatModal />
    </div>
  </div>
</template>

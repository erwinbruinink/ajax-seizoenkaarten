<script setup lang="ts">
import type { StatEntry } from '~/types'

const stats = ref<StatEntry[]>([])
const { data } = await useFetch<StatEntry[]>('/api/stats')
stats.value = data.value || []

const max = computed(() => Math.max(1, ...stats.value.map((s) => s.count)))
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
    <h3 class="font-extrabold text-sm mb-4">Eerlijke verdeling &middot; wedstrijden dit seizoen</h3>
    <div v-if="!stats.length" class="text-sm text-gray-400">Nog geen data.</div>
    <div v-else class="space-y-2.5">
      <div v-for="s in stats" :key="s.name" class="flex items-center gap-3">
        <span class="w-20 text-xs font-semibold text-gray-600 truncate">{{ s.name }}</span>
        <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
          <div class="bg-ajax-red h-full rounded-full transition-all" :style="{ width: `${(s.count / max) * 100}%` }" />
        </div>
        <span class="w-6 text-right text-xs font-bold tabular-nums">{{ s.count }}</span>
      </div>
    </div>
  </div>
</template>

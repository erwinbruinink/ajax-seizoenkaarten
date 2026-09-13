<script setup lang="ts">
import type { MatchDto } from '~/types'
import { daysUntil, seatFor } from '~/composables/useMatches'

const props = defineProps<{ matches: MatchDto[] }>()

const alerts = computed(() =>
  props.matches
    .filter((m) => m.status === 'SCHEDULED')
    .map((m) => ({ match: m, days: daysUntil(m.dateTime) }))
    .filter(({ days }) => days >= 0 && days <= 5)
    .filter(({ match }) => {
      const s302 = seatFor(match, 302)
      const s303 = seatFor(match, 303)
      const isDefinitive = (s: typeof s302) => !!s && s.status === 'CONFIRMED'
      return !isDefinitive(s302) || !isDefinitive(s303)
    })
)
</script>

<template>
  <div v-if="alerts.length" class="space-y-2">
    <div
      v-for="{ match, days } in alerts"
      :key="match.id"
      class="rounded-xl border-l-4 p-4 shadow-card flex items-start gap-3"
      :class="days <= 2 ? 'bg-red-50 border-ajax-red' : 'bg-orange-50 border-orange-400'"
    >
      <span class="text-xl">&#9888;&#65039;</span>
      <div class="text-sm">
        <p class="font-bold">
          Ajax &ndash; {{ match.opponent }} over {{ Math.ceil(days) }} dag{{ Math.ceil(days) === 1 ? '' : 'en' }}
        </p>
        <p class="text-gray-600">Nog geen definitieve bezetting voor beide stoelen. Regel snel een aanvraag of resale!</p>
      </div>
    </div>
  </div>
</template>

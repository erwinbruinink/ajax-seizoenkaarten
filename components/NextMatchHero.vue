<script setup lang="ts">
import type { MatchDto } from '~/types'

const props = defineProps<{ match: MatchDto }>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const target = computed(() => new Date(props.match.dateTime).getTime())
const diff = computed(() => Math.max(0, target.value - now.value))

const countdown = computed(() => {
  const totalSeconds = Math.floor(diff.value / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
})

const formattedDate = computed(() =>
  new Date(props.match.dateTime).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
)
const formattedTime = computed(() =>
  new Date(props.match.dateTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
)

const wazeUrl = 'https://waze.com/ul?q=P3%20Mikado%20Parking%20Johan%20Cruijff%20ArenA&navigate=yes'
const gmapsUrl = 'https://www.google.com/maps/search/?api=1&query=P3+Mikado+Parking+Johan+Cruijff+ArenA'

const icsUrl = computed(() => `/api/matches/${props.match.id}.ics`)
</script>

<template>
  <div class="bg-gradient-to-br from-ajax-black via-ajax-black to-ajax-red-dark text-white rounded-2xl shadow-card-lg p-6 sm:p-8 overflow-hidden relative">
    <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-ajax-red/20 blur-2xl" />
    <p class="text-xs uppercase tracking-widest text-red-300 font-semibold mb-2">Volgende thuiswedstrijd</p>
    <h2 class="text-3xl sm:text-4xl font-extrabold mb-1">Ajax &ndash; {{ match.opponent }}</h2>
    <p class="text-gray-300 text-sm mb-5">{{ match.competition }} &middot; {{ formattedDate }} &middot; {{ formattedTime }}</p>

    <div class="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mb-6">
      <div v-for="(val, key) in { Dagen: countdown.days, Uur: countdown.hours, Min: countdown.minutes, Sec: countdown.seconds }" :key="key" class="bg-white/10 rounded-xl p-2 sm:p-3 text-center backdrop-blur">
        <p class="text-xl sm:text-2xl font-extrabold tabular-nums">{{ val }}</p>
        <p class="text-[10px] sm:text-xs text-gray-300 uppercase">{{ key }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 text-sm text-gray-200 mb-6">
      <span class="bg-white/10 rounded-lg px-3 py-1.5">Vak 123</span>
      <span class="bg-white/10 rounded-lg px-3 py-1.5">Rij 3</span>
      <span class="bg-white/10 rounded-lg px-3 py-1.5">Stoelen 302 &amp; 303</span>
      <span class="bg-white/10 rounded-lg px-3 py-1.5">Parkeren: P3 Mikado</span>
    </div>

    <div class="flex flex-wrap gap-3">
      <a :href="wazeUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white text-ajax-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition">
        Navigeer met Waze
      </a>
      <a :href="gmapsUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white/10 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/20 transition">
        Google Maps
      </a>
      <a :href="icsUrl" class="inline-flex items-center gap-2 bg-ajax-red text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-ajax-red-dark transition">
        + Agenda
      </a>
    </div>
  </div>
</template>

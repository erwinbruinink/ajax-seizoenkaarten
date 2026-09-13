<script setup lang="ts">
import type { MatchDto } from '~/types'

const props = defineProps<{ matches: MatchDto[] }>()
const { session } = useAuth()

type FilterKey = 'all' | 'free' | 'mine' | 'resale'
const filter = ref<FilterKey>('all')

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alles tonen' },
  { key: 'free', label: 'Alleen vrije stoelen' },
  { key: 'mine', label: 'Mijn wedstrijden' },
  { key: 'resale', label: 'Resale' }
]

function matchesMe(m: MatchDto) {
  if (!session.value) return false
  return m.seatAllocations.some((a) => {
    if (session.value!.role === 'FRIEND') return a.guestName === session.value!.displayName
    return a.userId === session.value!.userId
  })
}

function hasFreeSeat(m: MatchDto) {
  return [302, 303].some((n) => !m.seatAllocations.find((a) => a.seatNumber === n))
}

function hasResale(m: MatchDto) {
  return m.seatAllocations.some((a) => a.status === 'RESALE')
}

const filtered = computed(() => {
  const list = [...props.matches].sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime))
  if (filter.value === 'free') return list.filter(hasFreeSeat)
  if (filter.value === 'mine') return list.filter(matchesMe)
  if (filter.value === 'resale') return list.filter(hasResale)
  return list
})

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <div class="flex gap-2 overflow-x-auto pb-1 mb-4">
      <button
        v-for="f in filters"
        :key="f.key"
        class="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition"
        :class="filter === f.key ? 'bg-ajax-red text-white border-ajax-red' : 'bg-white text-gray-600 border-gray-300 hover:border-ajax-red'"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="m in filtered"
        :key="m.id"
        class="bg-white rounded-xl border border-gray-200 shadow-card p-4"
        :class="m.status === 'FINISHED' ? 'opacity-60' : ''"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-bold text-sm sm:text-base">Ajax &ndash; {{ m.opponent }}</p>
            <p class="text-xs text-gray-500">{{ m.competition }} &middot; {{ formatDate(m.dateTime) }} &middot; {{ formatTime(m.dateTime) }}</p>
          </div>
          <span v-if="m.status === 'FINISHED'" class="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-1">Gespeeld</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <SeatBadge :match="m" :seat-number="302" />
          <SeatBadge :match="m" :seat-number="303" />
        </div>
      </div>

      <p v-if="!filtered.length" class="text-center text-gray-400 text-sm py-8">Geen wedstrijden gevonden voor dit filter.</p>
    </div>
  </div>
</template>

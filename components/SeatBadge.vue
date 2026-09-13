<script setup lang="ts">
import type { MatchDto } from '~/types'
import { seatFor } from '~/composables/useMatches'

const props = defineProps<{ match: MatchDto; seatNumber: 302 | 303 }>()
const { open } = useSeatModal()

const seat = computed(() => seatFor(props.match, props.seatNumber))

const style = computed(() => {
  const s = seat.value
  if (!s) return { label: 'Vrij', classes: 'bg-gray-100 text-gray-600 border-gray-200' }
  if (s.status === 'PENDING') return { label: `In afwachting: ${s.user?.name || s.guestName}`, classes: 'bg-yellow-50 text-yellow-800 border-yellow-300' }
  if (s.status === 'RESALE') return { label: `Resale${s.resalePrice ? ` €${s.resalePrice}` : ''}`, classes: 'bg-purple-50 text-purple-700 border-purple-300' }
  return { label: s.user?.name || s.guestName || 'Toegewezen', classes: 'bg-green-50 text-green-800 border-green-300' }
})
</script>

<template>
  <button
    class="w-full text-left border rounded-lg px-3 py-2 flex items-center justify-between gap-2 hover:brightness-95 transition"
    :class="style.classes"
    @click="open(match.id, seatNumber)"
  >
    <span class="text-xs font-semibold">Stoel {{ seatNumber }}</span>
    <span class="text-xs truncate max-w-[9rem] flex items-center gap-1">
      {{ style.label }}
      <span v-if="seat?.ticketTransferred" title="Kaart verzonden in Ajax App">&#9989;</span>
    </span>
  </button>
</template>

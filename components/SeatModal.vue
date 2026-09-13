<script setup lang="ts">
import type { PublicUser } from '~/types'
import { seatFor } from '~/composables/useMatches'

const { target, close } = useSeatModal()
const { session, isAdmin } = useAuth()
const { matches, refresh } = useMatches()

const loading = ref(false)
const error = ref('')

const match = computed(() => matches.value.find((m) => m.id === target.value?.matchId) || null)
const seat = computed(() => (match.value && target.value ? seatFor(match.value, target.value.seatNumber) : null))

const { data: usersData } = await useFetch<PublicUser[]>('/api/users')
const assignableUsers = computed(() => (usersData.value || []).filter((u) => u.role !== 'FRIEND'))

const assignMode = ref<'user' | 'guest'>('user')
const selectedUserId = ref<number | null>(null)
const guestName = ref('')
const status = ref<'PENDING' | 'CONFIRMED' | 'RESALE'>('CONFIRMED')
const ticketTransferred = ref(false)
const resalePrice = ref('')
const notes = ref('')

function resetForm() {
  const s = seat.value
  if (s?.userId) {
    assignMode.value = 'user'
    selectedUserId.value = s.userId
    guestName.value = ''
  } else if (s?.guestName) {
    assignMode.value = 'guest'
    guestName.value = s.guestName
    selectedUserId.value = null
  } else {
    assignMode.value = 'user'
    selectedUserId.value = null
    guestName.value = ''
  }
  status.value = s?.status || 'CONFIRMED'
  ticketTransferred.value = s?.ticketTransferred || false
  resalePrice.value = s?.resalePrice || ''
  notes.value = s?.notes || ''
  error.value = ''
}

watch(target, (t) => {
  if (t) resetForm()
})

const isOwnPendingRequest = computed(() => {
  if (!seat.value || seat.value.status !== 'PENDING' || !session.value) return false
  if (session.value.role === 'CHILD') return seat.value.userId === session.value.userId
  if (session.value.role === 'FRIEND') return seat.value.guestName === session.value.displayName
  return false
})

async function requestSeat() {
  if (!target.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/seats', { method: 'POST', body: { matchId: target.value.matchId, seatNumber: target.value.seatNumber } })
    await refresh()
    close()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Aanvragen mislukt'
  } finally {
    loading.value = false
  }
}

async function withdraw() {
  if (!seat.value) return
  loading.value = true
  try {
    await $fetch(`/api/seats/${seat.value.id}`, { method: 'DELETE' })
    await refresh()
    close()
  } finally {
    loading.value = false
  }
}

async function adminSave() {
  if (!target.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/seats', {
      method: 'POST',
      body: {
        matchId: target.value.matchId,
        seatNumber: target.value.seatNumber,
        userId: assignMode.value === 'user' ? selectedUserId.value : null,
        guestName: assignMode.value === 'guest' ? guestName.value : null,
        status: status.value,
        notes: notes.value
      }
    })
    if (seat.value) {
      await $fetch(`/api/seats/${seat.value.id}`, {
        method: 'PATCH',
        body: { ticketTransferred: ticketTransferred.value, resalePrice: resalePrice.value || null }
      })
    }
    await refresh()
    close()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Opslaan mislukt'
  } finally {
    loading.value = false
  }
}

async function adminApprove() {
  if (!seat.value) return
  loading.value = true
  try {
    await $fetch(`/api/seats/${seat.value.id}`, { method: 'PATCH', body: { status: 'CONFIRMED' } })
    await refresh()
    close()
  } finally {
    loading.value = false
  }
}

async function adminReject() {
  if (!seat.value) return
  loading.value = true
  try {
    await $fetch(`/api/seats/${seat.value.id}`, { method: 'DELETE' })
    await refresh()
    close()
  } finally {
    loading.value = false
  }
}

async function adminClear() {
  if (!seat.value) return
  loading.value = true
  try {
    await $fetch(`/api/seats/${seat.value.id}`, { method: 'DELETE' })
    await refresh()
    close()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="target && match" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" @click.self="close">
    <div class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 shadow-card-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-xs text-gray-500">Ajax &ndash; {{ match.opponent }}</p>
          <h3 class="font-extrabold text-lg">Stoel {{ target.seatNumber }}</h3>
        </div>
        <button class="text-gray-400 hover:text-gray-700 text-xl leading-none" @click="close">&times;</button>
      </div>

      <p v-if="error" class="text-ajax-red text-sm mb-3">{{ error }}</p>

      <!-- Non-admin: seat free -> request -->
      <div v-if="!isAdmin && !seat">
        <p class="text-sm text-gray-600 mb-4">Deze stoel is nog vrij voor deze wedstrijd.</p>
        <button class="w-full bg-ajax-red text-white font-semibold py-2.5 rounded-lg hover:bg-ajax-red-dark disabled:opacity-50" :disabled="loading" @click="requestSeat">
          Aanvragen
        </button>
      </div>

      <!-- Non-admin: own pending request -->
      <div v-else-if="!isAdmin && isOwnPendingRequest">
        <p class="text-sm text-gray-600 mb-4">Je aanvraag staat nog in afwachting van goedkeuring.</p>
        <button class="w-full bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50" :disabled="loading" @click="withdraw">
          Aanvraag intrekken
        </button>
      </div>

      <!-- Non-admin: taken by someone else -->
      <div v-else-if="!isAdmin && seat">
        <p class="text-sm text-gray-600">
          Deze stoel is
          <span v-if="seat.status === 'PENDING'">in aanvraag door <strong>{{ seat.user?.name || seat.guestName }}</strong>.</span>
          <span v-else-if="seat.status === 'RESALE'">te koop via resale{{ seat.resalePrice ? ` voor €${seat.resalePrice}` : '' }}.</span>
          <span v-else>toegewezen aan <strong>{{ seat.user?.name || seat.guestName }}</strong>.</span>
        </p>
      </div>

      <!-- Admin panel -->
      <div v-else-if="isAdmin" class="space-y-4">
        <div v-if="seat?.status === 'PENDING'" class="flex gap-2">
          <button class="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 disabled:opacity-50" :disabled="loading" @click="adminApprove">Goedkeuren</button>
          <button class="flex-1 bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50" :disabled="loading" @click="adminReject">Afwijzen</button>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5">Toewijzen aan</p>
          <div class="flex gap-2 mb-2">
            <button class="flex-1 text-sm py-1.5 rounded-lg border" :class="assignMode === 'user' ? 'bg-ajax-black text-white border-ajax-black' : 'border-gray-300'" @click="assignMode = 'user'">Persoon</button>
            <button class="flex-1 text-sm py-1.5 rounded-lg border" :class="assignMode === 'guest' ? 'bg-ajax-black text-white border-ajax-black' : 'border-gray-300'" @click="assignMode = 'guest'">Vriend(in)</button>
          </div>
          <select v-if="assignMode === 'user'" v-model="selectedUserId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option :value="null">Kies persoon...</option>
            <option v-for="u in assignableUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <input v-else v-model="guestName" type="text" placeholder="Naam vriend(in)" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5">Status</p>
          <select v-model="status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="CONFIRMED">Toegewezen (definitief)</option>
            <option value="PENDING">In afwachting</option>
            <option value="RESALE">Te koop op Resale</option>
          </select>
        </div>

        <div v-if="status === 'RESALE'">
          <p class="text-xs font-semibold text-gray-500 mb-1.5">Verkoopprijs (&euro;)</p>
          <input v-model="resalePrice" type="number" step="0.01" min="0" placeholder="45.00" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5">Notitie</p>
          <textarea v-model="notes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="ticketTransferred" type="checkbox" class="w-4 h-4 accent-ajax-red" />
          Kaart verzonden in Ajax App
        </label>

        <div class="flex gap-2 pt-2">
          <button class="flex-1 bg-ajax-red text-white font-semibold py-2.5 rounded-lg hover:bg-ajax-red-dark disabled:opacity-50" :disabled="loading" @click="adminSave">
            Opslaan
          </button>
          <button v-if="seat" class="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50" :disabled="loading" @click="adminClear">
            Vrijmaken
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

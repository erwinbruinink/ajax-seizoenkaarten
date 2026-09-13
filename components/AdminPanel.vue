<script setup lang="ts">
import type { MatchDto } from '~/types'

const { matches, refresh } = useMatches()

const pendingRequests = computed(() => {
  const list: { match: MatchDto; allocation: MatchDto['seatAllocations'][number] }[] = []
  for (const m of matches.value) {
    for (const a of m.seatAllocations) {
      if (a.status === 'PENDING') list.push({ match: m, allocation: a })
    }
  }
  return list.sort((a, b) => +new Date(a.match.dateTime) - +new Date(b.match.dateTime))
})

const actionLoading = ref<number | null>(null)

async function approve(id: number) {
  actionLoading.value = id
  try {
    await $fetch(`/api/seats/${id}`, { method: 'PATCH', body: { status: 'CONFIRMED' } })
    await refresh()
  } finally {
    actionLoading.value = null
  }
}

async function reject(id: number) {
  actionLoading.value = id
  try {
    await $fetch(`/api/seats/${id}`, { method: 'DELETE' })
    await refresh()
  } finally {
    actionLoading.value = null
  }
}

// New match form
const newOpponent = ref('')
const newCompetition = ref('Eredivisie')
const newDate = ref('')
const newTime = ref('')
const creating = ref(false)
const createError = ref('')

const competitions = ['Eredivisie', 'KNVB Beker', 'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League']

async function createMatch() {
  createError.value = ''
  if (!newOpponent.value.trim() || !newDate.value || !newTime.value) {
    createError.value = 'Vul tegenstander, datum en tijd in'
    return
  }
  creating.value = true
  try {
    await $fetch('/api/matches', {
      method: 'POST',
      body: {
        opponent: newOpponent.value,
        competition: newCompetition.value,
        dateTime: new Date(`${newDate.value}T${newTime.value}:00`).toISOString()
      }
    })
    newOpponent.value = ''
    newDate.value = ''
    newTime.value = ''
    await refresh()
  } catch (e: any) {
    createError.value = e?.data?.statusMessage || 'Aanmaken mislukt'
  } finally {
    creating.value = false
  }
}

// Edit existing match date/time/opponent/status
const editingId = ref<number | null>(null)
const editOpponent = ref('')
const editCompetition = ref('')
const editDate = ref('')
const editTime = ref('')
const editStatus = ref<'SCHEDULED' | 'FINISHED'>('SCHEDULED')
const editSaving = ref(false)

function startEdit(m: MatchDto) {
  editingId.value = m.id
  editOpponent.value = m.opponent
  editCompetition.value = m.competition
  const d = new Date(m.dateTime)
  editDate.value = d.toISOString().slice(0, 10)
  editTime.value = d.toTimeString().slice(0, 5)
  editStatus.value = m.status
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit() {
  if (!editingId.value) return
  editSaving.value = true
  try {
    await $fetch(`/api/matches/${editingId.value}`, {
      method: 'PATCH',
      body: {
        opponent: editOpponent.value,
        competition: editCompetition.value,
        dateTime: new Date(`${editDate.value}T${editTime.value}:00`).toISOString(),
        status: editStatus.value
      }
    })
    editingId.value = null
    await refresh()
  } finally {
    editSaving.value = false
  }
}

const sortedMatches = computed(() => [...matches.value].sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime)))

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-8">
    <section>
      <h2 class="font-extrabold text-lg mb-3">Openstaande aanvragen</h2>
      <div v-if="!pendingRequests.length" class="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-4">Geen openstaande aanvragen.</div>
      <div v-else class="space-y-2">
        <div v-for="{ match, allocation } in pendingRequests" :key="allocation.id" class="bg-white rounded-xl border border-gray-200 shadow-card p-4 flex items-center justify-between gap-3">
          <div class="text-sm">
            <p class="font-semibold">{{ allocation.user?.name || allocation.guestName }} &middot; Stoel {{ allocation.seatNumber }}</p>
            <p class="text-xs text-gray-500">Ajax &ndash; {{ match.opponent }} &middot; {{ formatDateTime(match.dateTime) }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button class="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50" :disabled="actionLoading === allocation.id" @click="approve(allocation.id)">Goedkeuren</button>
            <button class="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50" :disabled="actionLoading === allocation.id" @click="reject(allocation.id)">Afwijzen</button>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="font-extrabold text-lg mb-3">Wedstrijd toevoegen</h2>
      <div class="bg-white rounded-xl border border-gray-200 shadow-card p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <input v-model="newOpponent" type="text" placeholder="Tegenstander" class="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select v-model="newCompetition" class="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option v-for="c in competitions" :key="c" :value="c">{{ c }}</option>
          </select>
          <input v-model="newDate" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="newTime" type="time" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <p v-if="createError" class="text-ajax-red text-sm">{{ createError }}</p>
        <button class="w-full bg-ajax-red text-white font-semibold py-2.5 rounded-lg hover:bg-ajax-red-dark disabled:opacity-50" :disabled="creating" @click="createMatch">
          Wedstrijd toevoegen
        </button>
      </div>
    </section>

    <section>
      <h2 class="font-extrabold text-lg mb-3">Alle wedstrijden beheren</h2>
      <div class="space-y-2">
        <div v-for="m in sortedMatches" :key="m.id" class="bg-white rounded-xl border border-gray-200 shadow-card p-4">
          <div v-if="editingId !== m.id" class="flex items-center justify-between gap-3">
            <div class="text-sm">
              <p class="font-semibold">Ajax &ndash; {{ m.opponent }}</p>
              <p class="text-xs text-gray-500">{{ m.competition }} &middot; {{ formatDateTime(m.dateTime) }} &middot; {{ m.status === 'FINISHED' ? 'Gespeeld' : 'Gepland' }}</p>
            </div>
            <button class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50" @click="startEdit(m)">Bewerken</button>
          </div>
          <div v-else class="space-y-2">
            <input v-model="editOpponent" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select v-model="editCompetition" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option v-for="c in competitions" :key="c" :value="c">{{ c }}</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="editDate" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input v-model="editTime" type="time" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <select v-model="editStatus" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="SCHEDULED">Gepland</option>
              <option value="FINISHED">Gespeeld</option>
            </select>
            <div class="flex gap-2">
              <button class="flex-1 bg-ajax-red text-white font-semibold py-2 rounded-lg hover:bg-ajax-red-dark disabled:opacity-50" :disabled="editSaving" @click="saveEdit">Opslaan</button>
              <button class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" @click="cancelEdit">Annuleren</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

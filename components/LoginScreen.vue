<script setup lang="ts">
import type { PublicUser } from '~/types'

const { login, fetchSession } = useAuth()

const users = ref<PublicUser[]>([])
const selected = ref<PublicUser | null>(null)
const pin = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)

const { data } = await useFetch<PublicUser[]>('/api/users')
users.value = data.value || []

const admins = computed(() => users.value.filter((u) => u.role === 'ADMIN'))
const children = computed(() => users.value.filter((u) => u.role === 'CHILD'))
const friends = computed(() => users.value.filter((u) => u.role === 'FRIEND'))

function selectUser(user: PublicUser) {
  selected.value = user
  pin.value = ''
  error.value = ''
}

function back() {
  selected.value = null
  pin.value = ''
  displayName.value = ''
  error.value = ''
}

function pressDigit(d: string) {
  if (pin.value.length >= 4) return
  pin.value += d
  error.value = ''
  if (pin.value.length === 4) submit()
}

function backspace() {
  pin.value = pin.value.slice(0, -1)
}

async function submit() {
  if (!selected.value) return
  if (selected.value.role === 'FRIEND' && !displayName.value.trim()) {
    error.value = 'Vul eerst je naam in'
    return
  }
  if (pin.value.length !== 4) return

  loading.value = true
  error.value = ''
  try {
    await login(selected.value.id, pin.value, displayName.value)
    await fetchSession()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Onjuiste pincode'
    pin.value = ''
  } finally {
    loading.value = false
  }
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-ajax-black px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-ajax-red flex items-center justify-center text-white text-3xl font-extrabold shadow-card-lg">A</div>
        <h1 class="mt-4 text-2xl font-extrabold text-white">Wie ben jij?</h1>
        <p class="text-gray-400 text-sm mt-1">Vak 123 · Rij 3 · Stoel 302 & 303</p>
      </div>

      <div v-if="!selected" class="space-y-5">
        <div v-if="admins.length">
          <p class="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">Admins</p>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="u in admins"
              :key="u.id"
              class="bg-white rounded-xl p-4 flex flex-col items-center gap-2 shadow-card hover:ring-2 hover:ring-ajax-red transition"
              @click="selectUser(u)"
            >
              <span class="w-10 h-10 rounded-full bg-ajax-red text-white flex items-center justify-center font-bold">{{ initials(u.name) }}</span>
              <span class="font-semibold text-sm">{{ u.name }}</span>
            </button>
          </div>
        </div>

        <div v-if="children.length">
          <p class="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">Kinderen</p>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="u in children"
              :key="u.id"
              class="bg-white rounded-xl p-3 flex flex-col items-center gap-2 shadow-card hover:ring-2 hover:ring-ajax-red transition"
              @click="selectUser(u)"
            >
              <span class="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm">{{ initials(u.name) }}</span>
              <span class="font-semibold text-xs">{{ u.name }}</span>
            </button>
          </div>
        </div>

        <div v-if="friends.length">
          <p class="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">Vrienden</p>
          <button
            v-for="u in friends"
            :key="u.id"
            class="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-card hover:ring-2 hover:ring-ajax-red transition"
            @click="selectUser(u)"
          >
            <span class="w-10 h-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">V</span>
            <span class="font-semibold text-sm">Ik ben een vriend(in)</span>
          </button>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl p-6 shadow-card-lg">
        <button class="text-sm text-gray-500 mb-4 flex items-center gap-1" @click="back">&larr; Terug</button>

        <div class="text-center mb-4">
          <p class="font-bold text-lg">{{ selected.role === 'FRIEND' ? 'Vriend(in)' : selected.name }}</p>
          <p class="text-xs text-gray-500">Voer de 4-cijferige pincode in</p>
        </div>

        <input
          v-if="selected.role === 'FRIEND'"
          v-model="displayName"
          type="text"
          placeholder="Jouw naam"
          class="w-full mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ajax-red"
        />

        <div class="flex justify-center gap-3 mb-4">
          <span
            v-for="i in 4"
            :key="i"
            class="w-4 h-4 rounded-full border-2 border-ajax-red"
            :class="pin.length >= i ? 'bg-ajax-red' : 'bg-white'"
          />
        </div>

        <p v-if="error" class="text-center text-ajax-red text-sm mb-3">{{ error }}</p>

        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="d in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
            :key="d"
            class="py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg"
            :disabled="loading"
            @click="pressDigit(d)"
          >
            {{ d }}
          </button>
          <div />
          <button class="py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-lg" :disabled="loading" @click="pressDigit('0')">0</button>
          <button class="py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-sm" :disabled="loading" @click="backspace">&#9003;</button>
        </div>

        <p v-if="loading" class="text-center text-xs text-gray-400 mt-3">Bezig met inloggen...</p>
      </div>
    </div>
  </div>
</template>

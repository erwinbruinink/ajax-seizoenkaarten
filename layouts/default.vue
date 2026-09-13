<script setup lang="ts">
const { session, isAdmin, logout } = useAuth()
const route = useRoute()
</script>

<template>
  <div>
    <header v-if="session" class="sticky top-0 z-30 bg-ajax-black text-white shadow-card-lg">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-extrabold tracking-tight">
          <span class="w-7 h-7 rounded-lg bg-ajax-red flex items-center justify-center text-sm">A</span>
          <span class="text-sm">Vak 123</span>
        </NuxtLink>

        <nav class="flex items-center gap-2 text-sm">
          <NuxtLink
            to="/"
            class="px-2 py-1 rounded"
            :class="route.path === '/' ? 'bg-white/10' : 'hover:bg-white/5'"
          >Schema</NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="px-2 py-1 rounded"
            :class="route.path === '/admin' ? 'bg-white/10' : 'hover:bg-white/5'"
          >Beheer</NuxtLink>
          <span class="hidden sm:inline text-gray-400 px-1">{{ session.displayName }}</span>
          <button class="px-2 py-1 rounded hover:bg-white/5 text-gray-300" @click="logout">Uitloggen</button>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>

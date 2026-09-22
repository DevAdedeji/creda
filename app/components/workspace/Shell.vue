<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

const route = useRoute()
const { data: session } = await authClient.useSession(useFetch)
const { data: viewer } = await useFetch<{ user: { id: string; isAdmin: boolean } }>('/api/me', {
  immediate: Boolean(session.value),
})
const isAdmin = computed(
  () =>
    session.value?.user.emailVerified === true &&
    viewer.value?.user.id === session.value.user.id &&
    viewer.value?.user.isAdmin === true,
)
const mobileOpen = ref(false)
const signingOut = ref(false)
const appToast = useAppToast()

const links = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/account' },
  { label: 'Your businesses', icon: 'i-lucide-store', to: '/dashboard/businesses' },
  { label: 'Saved businesses', icon: 'i-lucide-bookmark', to: '/saved' },
  { label: 'My account', icon: 'i-lucide-user-round', to: '/profile' },
] as const
const adminLinks = [
  { label: 'Admin overview', icon: 'i-lucide-chart-no-axes-combined', to: '/admin' },
  { label: 'Ownership checks', icon: 'i-lucide-badge-check', to: '/admin/verification' },
  { label: 'Manage reviews', icon: 'i-lucide-message-square', to: '/admin/reviews' },
  { label: 'Content reports', icon: 'i-lucide-flag', to: '/admin/reports' },
] as const

function isActive(to: string) {
  return to === '/dashboard/businesses'
    ? route.path.startsWith('/dashboard/businesses') || route.path === '/businesses/new'
    : route.path === to
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    const result = await authClient.signOut()
    if (result.error) throw result.error
    mobileOpen.value = false
    await navigateTo('/')
  } catch {
    appToast.error('Could not sign out', 'Please try again.')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#fbfcf9] text-[#172f27]">
    <header class="sticky top-0 z-40 border-b border-[#e4e9e0] bg-white/95 backdrop-blur-lg">
      <div
        class="mx-auto flex h-[76px] w-full max-w-[1536px] items-center justify-between gap-5 px-5 sm:px-8 xl:px-10"
      >
        <LandingLogo compact to="/account" />
        <div class="flex items-center gap-3 sm:gap-6">
          <NuxtLink
            to="/explore"
            class="hidden items-center gap-2 text-sm font-medium text-[#526555] transition hover:text-[#143e32] sm:inline-flex"
          >
            <UIcon name="i-lucide-arrow-left" /> Explore businesses
          </NuxtLink>
          <span class="hidden h-6 w-px bg-[#e4e9e0] sm:block" aria-hidden="true" />
          <NuxtLink
            v-if="session"
            to="/profile"
            class="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e0e8dc] bg-white transition hover:border-[#b7cbb1] hover:bg-[#f6f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668b48]"
            aria-label="My account"
          >
            <img
              v-if="session.user.image"
              :src="session.user.image"
              alt=""
              referrerpolicy="no-referrer"
              class="size-8 rounded-lg object-cover"
              width="32"
              height="32"
            />
            <span
              v-else
              class="grid size-8 place-items-center rounded-lg bg-[#d8f36a] text-sm font-bold text-[#143e32]"
            >
              {{ session.user.name.charAt(0).toUpperCase() }}
            </span>
          </NuxtLink>
          <UButton
            color="neutral"
            variant="ghost"
            :icon="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            :aria-label="mobileOpen ? 'Close workspace menu' : 'Open workspace menu'"
            class="lg:!hidden"
            @click="mobileOpen = true"
          />
        </div>
      </div>
    </header>

    <div
      class="mx-auto grid min-h-[calc(100dvh-76px)] w-full max-w-[1536px] lg:grid-cols-[248px_minmax(0,1fr)]"
    >
      <aside
        class="hidden border-r border-[#e4e9e0] bg-white px-5 lg:sticky lg:top-[76px] lg:flex lg:h-[calc(100dvh-76px)] lg:flex-col lg:self-start"
        aria-label="Workspace navigation"
      >
        <div class="min-h-0 flex-1 overflow-y-auto py-9">
          <p class="px-3 text-[10px] font-bold uppercase tracking-[.19em] text-[#849286]">
            Your space
          </p>
          <nav class="mt-5 space-y-2" aria-label="Your space">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
              :class="
                isActive(link.to)
                  ? 'bg-[#143e32] text-white shadow-sm'
                  : 'text-[#5e6f62] hover:bg-[#f1f6ed] hover:text-[#143e32]'
              "
              :aria-current="isActive(link.to) ? 'page' : undefined"
            >
              <UIcon :name="link.icon" class="text-lg" /> {{ link.label }}
            </NuxtLink>
          </nav>
          <div class="mt-7 border-t border-[#e9ede5] pt-5">
            <NuxtLink
              to="/explore"
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#5e6f62] hover:bg-[#f1f6ed] hover:text-[#143e32]"
            >
              <UIcon name="i-lucide-arrow-up-right" class="text-lg" /> Explore the directory
            </NuxtLink>
          </div>
          <div v-if="isAdmin" class="mt-7 border-t border-[#e9ede5] pt-5">
            <p class="px-3 text-[10px] font-bold uppercase tracking-[.19em] text-[#849286]">
              Administration
            </p>
            <nav class="mt-4 space-y-1" aria-label="Administration">
              <NuxtLink
                v-for="link in adminLinks"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
                :class="
                  isActive(link.to)
                    ? 'bg-[#143e32] text-white shadow-sm'
                    : 'text-[#5e6f62] hover:bg-[#f1f6ed] hover:text-[#143e32]'
                "
                :aria-current="isActive(link.to) ? 'page' : undefined"
              >
                <UIcon :name="link.icon" class="text-lg" /> {{ link.label }}
              </NuxtLink>
            </nav>
          </div>
        </div>
        <div class="shrink-0 border-t border-[#e9ede5] bg-white pb-6 pt-5">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            :disabled="signingOut"
            @click="signOut"
          >
            <UIcon name="i-lucide-log-out" class="text-lg" /> Sign out
          </button>
        </div>
      </aside>

      <div class="min-w-0"><slot /></div>
    </div>

    <USlideover
      v-model:open="mobileOpen"
      side="left"
      title="Your space"
      :ui="{ content: 'w-[min(88vw,360px)] bg-white' }"
    >
      <template #body>
        <div v-if="session" class="flex items-center gap-3 border-b border-[#e8ede5] pb-6">
          <img
            v-if="session.user.image"
            :src="session.user.image"
            alt=""
            referrerpolicy="no-referrer"
            class="size-11 rounded-xl object-cover"
            width="44"
            height="44"
          />
          <span
            v-else
            class="grid size-11 place-items-center rounded-xl bg-[#d8f36a] font-bold text-[#143e32]"
            >{{ session.user.name.charAt(0).toUpperCase() }}</span
          >
          <div class="min-w-0">
            <p class="truncate font-semibold text-[#143e32]">{{ session.user.name }}</p>
            <p class="truncate text-xs text-[#758577]">{{ session.user.email }}</p>
          </div>
        </div>
        <nav class="mt-5 space-y-1" aria-label="Mobile workspace navigation">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold"
            :class="
              isActive(link.to) ? 'bg-[#143e32] text-white' : 'text-[#526555] hover:bg-[#f1f6ed]'
            "
            :aria-current="isActive(link.to) ? 'page' : undefined"
            @click="mobileOpen = false"
            ><UIcon :name="link.icon" class="text-lg" />{{ link.label }}</NuxtLink
          >
          <NuxtLink
            to="/explore"
            class="mt-5 flex items-center gap-3 border-t border-[#e8ede5] px-4 py-4 text-sm font-medium text-[#526555]"
            @click="mobileOpen = false"
            ><UIcon name="i-lucide-arrow-up-right" class="text-lg" />Explore the directory</NuxtLink
          >
          <div v-if="isAdmin" class="mt-5 border-t border-[#e8ede5] pt-5">
            <p class="px-4 text-[10px] font-bold uppercase tracking-[.19em] text-[#849286]">
              Administration
            </p>
            <NuxtLink
              v-for="link in adminLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold"
              :class="
                isActive(link.to) ? 'bg-[#143e32] text-white' : 'text-[#526555] hover:bg-[#f1f6ed]'
              "
              :aria-current="isActive(link.to) ? 'page' : undefined"
              @click="mobileOpen = false"
              ><UIcon :name="link.icon" class="text-lg" />{{ link.label }}</NuxtLink
            >
          </div>
        </nav>
      </template>
      <template #footer>
        <button
          v-if="session"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          :disabled="signingOut"
          @click="signOut"
        >
          <UIcon name="i-lucide-log-out" class="text-lg" /> Sign out
        </button>
      </template>
    </USlideover>
  </div>
</template>

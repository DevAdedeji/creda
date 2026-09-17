<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)
const menuOpen = ref(false)
const signingOut = ref(false)
const toast = useToast()
const links = [
  { label: 'Explore businesses', href: '/businesses' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For businesses', href: '/#for-businesses' },
]

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    const result = await authClient.signOut()
    if (result.error) throw result.error
    menuOpen.value = false
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Could not sign out', description: 'Please try again.', color: 'error' })
  } finally {
    signingOut.value = false
  }
}

const accountMenu = computed(() => [
  [
    {
      label: session.value?.user.name ?? '',
      description: session.value?.user.email ?? '',
      type: 'label' as const,
    },
  ],
  [
    { label: 'Your account', icon: 'i-lucide-user-round', to: '/account' },
    { label: 'Your businesses', icon: 'i-lucide-store', to: '/dashboard/businesses' },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      class: 'text-red-600',
      onSelect: signOut,
    },
  ],
])
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[#e0e5dd] bg-[#fcfcf8]/95 backdrop-blur-lg">
    <div
      class="mx-auto flex h-[74px] w-full max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-24 lg:gap-7 xl:px-12"
    >
      <LandingLogo />
      <nav
        class="hidden items-center gap-4 text-sm font-medium lg:flex xl:gap-7"
        aria-label="Main navigation"
      >
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="relative py-2.5 text-[#172f27] after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[#143e32] after:transition-transform hover:after:scale-x-100 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668b48]"
          >{{ link.label }}</a
        >
      </nav>
      <UDropdownMenu
        v-if="session"
        :items="accountMenu"
        :ui="{ content: 'w-60', item: 'py-2.5' }"
        :content="{ align: 'end', sideOffset: 8 }"
        :modal="false"
      >
        <button
          type="button"
          class="hidden items-center gap-2.5 lg:flex rounded-xl border border-[#dfe6dc] bg-white px-2.5 py-2 text-left transition hover:border-[#b6c9af] hover:bg-[#f6f9f1]"
          :disabled="signingOut"
          aria-label="Open account menu"
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
            class="grid size-8 place-items-center rounded-lg bg-[#d8f36a] text-xs font-bold text-[#143e32]"
            >{{ session.user.name.charAt(0).toUpperCase() }}</span
          >
          <span class="max-w-30 truncate text-sm font-semibold text-[#143e32]">{{
            session.user.name.split(' ')[0]
          }}</span>
          <UIcon name="i-lucide-chevrons-up-down" class="text-sm text-[#7a8d7e]" />
        </button>
      </UDropdownMenu>
      <UButton
        v-else
        to="/signup"
        class="!hidden !rounded-lg !bg-[#143e32] !px-[18px] !py-3.5 !text-sm !text-white hover:!bg-[#24563f] lg:!inline-flex"
        color="primary"
        trailing-icon="i-lucide-arrow-up-right"
        >Join Creda</UButton
      >
      <UButton
        class="lg:!hidden"
        color="neutral"
        variant="ghost"
        :icon="menuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
        :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        @click="menuOpen = !menuOpen"
      />
    </div>
    <nav
      v-if="menuOpen"
      id="mobile-nav"
      class="flex flex-col border-t border-[#e0e5dd] bg-[#fcfcf8] px-5 pb-4 pt-2 lg:hidden"
      aria-label="Mobile navigation"
      @keydown.esc="menuOpen = false"
    >
      <a
        v-for="link in links"
        :key="link.href"
        :href="link.href"
        class="flex items-center justify-between border-b border-[#e0e5dd] py-3 text-[15px] font-semibold text-[#172f27]"
        @click="menuOpen = false"
        >{{ link.label }}<UIcon name="i-lucide-arrow-up-right"
      /></a>
      <template v-if="session">
        <NuxtLink
          to="/account"
          class="flex items-center justify-between border-b border-[#e0e5dd] py-3 text-[15px] font-semibold text-[#172f27]"
          @click="menuOpen = false"
          >Your account <UIcon name="i-lucide-user-round"
        /></NuxtLink>
        <NuxtLink
          to="/dashboard/businesses"
          class="flex items-center justify-between border-b border-[#e0e5dd] py-3 text-[15px] font-semibold text-[#172f27]"
          @click="menuOpen = false"
          >Your businesses <UIcon name="i-lucide-store"
        /></NuxtLink>
        <button
          type="button"
          class="flex w-full items-center justify-between border-t border-[#e0e5dd] px-0.5 py-3 text-left text-[15px] font-semibold text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668b48]"
          :disabled="signingOut"
          @click="signOut"
        >
          Sign out <UIcon name="i-lucide-log-out" />
        </button>
      </template>
      <NuxtLink
        v-else
        to="/signup"
        class="flex items-center justify-between py-3 text-[15px] font-semibold text-[#172f27]"
        @click="menuOpen = false"
        >Join Creda <UIcon name="i-lucide-arrow-up-right"
      /></NuxtLink>
    </nav>
  </header>
</template>

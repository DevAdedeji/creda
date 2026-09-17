<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)
const menuOpen = ref(false)
const links = [
  { label: 'Explore businesses', href: '/#explore' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For businesses', href: '/#for-businesses' },
]
</script>

<template>
  <header class="site-header">
    <div class="container nav-bar">
      <LandingLogo />
      <nav class="desktop-nav" aria-label="Main navigation">
        <a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a>
      </nav>
      <UButton
        :to="session ? '/account' : '/signup'"
        class="nav-cta"
        color="primary"
        trailing-icon="i-lucide-arrow-up-right"
        >{{ session ? 'My account' : 'Join Creda' }}</UButton
      >
      <UButton
        class="menu-toggle"
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
      class="mobile-nav"
      aria-label="Mobile navigation"
      @keydown.esc="menuOpen = false"
    >
      <a v-for="link in links" :key="link.href" :href="link.href" @click="menuOpen = false"
        >{{ link.label }}<UIcon name="i-lucide-arrow-up-right"
      /></a>
      <NuxtLink :to="session ? '/account' : '/signup'" @click="menuOpen = false"
        >{{ session ? 'My account' : 'Join Creda' }}<UIcon name="i-lucide-arrow-up-right"
      /></NuxtLink>
    </nav>
  </header>
</template>

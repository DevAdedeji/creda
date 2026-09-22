<script setup lang="ts">
import { informationPages } from '~~/shared/information-pages'
</script>

<template>
  <footer class="border-t border-[#dfe6dc] bg-[#f5f7f0]">
    <div
      class="mx-auto grid w-full max-w-[1920px] gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:px-8 xl:w-[90%] xl:px-0"
    >
      <div>
        <LandingLogo compact />
        <p class="mt-4 max-w-sm text-sm leading-6 text-[#657069]">
          Discover Nigerian businesses. Share your experience. Help someone make their next choice.
        </p>
        <NuxtLink
          to="/explore"
          class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >Explore businesses <UIcon name="i-lucide-arrow-up-right" aria-hidden="true"
        /></NuxtLink>
      </div>
      <nav aria-label="About Creda and help" class="grid content-start gap-1 sm:min-w-64">
        <p class="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#5d7b61]">
          Get to know Creda
        </p>
        <NuxtLink
          v-for="page in informationPages"
          :key="page.path"
          :to="page.path"
          class="inline-flex min-h-11 items-center text-sm font-medium text-[#315b3a] hover:underline"
          >{{ page.label }}</NuxtLink
        >
      </nav>
    </div>
  </footer>
</template>

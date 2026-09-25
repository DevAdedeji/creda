<script setup lang="ts">
import SearchMode from '@/components/discovery/SearchMode.vue'
import { nigeriaStates } from '~~/shared/nigeriaStates'
import { trackAnalyticsEvent } from '@/utils/analytics'

const query = ref('')
const state = ref('')
const aiSearch = ref(false)
function searchBusinesses() {
  trackAnalyticsEvent('search_submitted', {
    surface: 'homepage',
    mode: aiSearch.value ? 'ai' : 'standard',
    has_query: String(Boolean(query.value.trim())),
  })
  return navigateTo({
    path: '/explore',
    query: {
      q: query.value.trim() || undefined,
      state: state.value || undefined,
      mode: aiSearch.value ? 'ai' : undefined,
    },
  })
}
</script>

<template>
  <section aria-labelledby="hero-heading" class="pt-9 sm:pt-12">
    <div class="mb-6">
      <p class="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-[#59745c]">
        Discover Nigeria
      </p>
      <h1
        id="hero-heading"
        class="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-tight tracking-[-.055em] text-[#143e32]"
      >
        Find your next favourite business<span class="text-[#9fbd37]">.</span>
      </h1>
      <p class="mt-3 max-w-3xl text-sm leading-6 text-[#657069] sm:text-base">
        Read reviews, explore services, and discover businesses online and around you.
      </p>
    </div>
    <form
      role="search"
      aria-label="Find businesses"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 rounded-2xl border border-[#d9e3d2] bg-[#f0f5e9] p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(180px,.45fr)_auto]"
      @submit.prevent="searchBusinesses"
    >
      <div class="col-span-2 min-w-0 md:col-span-1">
        <div class="mb-2 flex min-h-6 items-center justify-between gap-3">
          <label for="business-search" class="text-sm font-semibold text-[#345341]"
            >Search businesses</label
          >
          <SearchMode v-model="aiSearch" />
        </div>
        <div
          class="flex h-13 items-center gap-3 rounded-xl border border-[#cbd8c5] bg-white px-4 focus-within:border-[#315b3a] focus-within:ring-2 focus-within:ring-[#315b3a]/15"
        >
          <UIcon
            name="i-lucide-search"
            class="shrink-0 text-xl text-[#627465]"
            aria-hidden="true"
          />
          <input
            id="business-search"
            v-model="query"
            name="q"
            type="search"
            :placeholder="
              aiSearch ? 'Describe what you need…' : 'Business name, category, or service'
            "
            :maxlength="500"
            autocomplete="off"
            class="h-full min-w-0 flex-1 bg-transparent text-base text-[#172f27] outline-none placeholder:text-[#737c73]"
          />
        </div>
      </div>
      <div>
        <label
          for="business-state"
          class="mb-2 flex min-h-6 items-center text-sm font-semibold text-[#345341]"
          >State</label
        >
        <div class="relative">
          <UIcon
            name="i-lucide-map-pin"
            class="pointer-events-none absolute left-3.5 top-4 text-xl text-[#627465]"
            aria-hidden="true"
          />
          <select
            id="business-state"
            v-model="state"
            name="state"
            class="h-13 w-full appearance-none rounded-xl border border-[#cbd8c5] bg-white pl-11 pr-9 text-base text-[#172f27] focus:border-[#315b3a] focus:outline-2 focus:outline-[#315b3a]/20"
          >
            <option value="">All states</option>
            <option v-for="name in nigeriaStates" :key="name" :value="name">{{ name }}</option>
          </select>
          <UIcon
            name="i-lucide-chevron-down"
            class="pointer-events-none absolute right-3 top-4.5 text-base text-[#627465]"
            aria-hidden="true"
          />
        </div>
      </div>
      <UButton
        type="submit"
        icon="i-lucide-search"
        class="!h-13 !justify-center !rounded-xl !bg-[#143e32] !px-6 !text-base !font-semibold !text-white hover:!bg-[#24563f]"
        >Search</UButton
      >
    </form>
  </section>
</template>

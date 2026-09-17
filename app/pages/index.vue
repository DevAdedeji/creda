<script setup lang="ts">
useSeoMeta({
  title: 'Creda — Find businesses worth knowing',
  description:
    'Discover businesses in Nigeria, understand who manages their profiles, and explore customer experiences. Meet your next great find on Creda.',
  ogTitle: 'Creda — Find businesses worth knowing',
  ogDescription:
    'A little context. A lot more confidence. Discover businesses and customer experiences on Creda.',
})

import BusinessCard from '../components/businesses/BusinessCard.vue'
import type { BusinessListResponse } from '~~/shared/businesses'

const categories = [
  { label: 'All businesses', value: '', icon: 'i-lucide-grid-2x2' },
  { label: 'Software & apps', value: 'software', icon: 'i-lucide-command' },
  { label: 'Creative & design', value: 'creative', icon: 'i-lucide-palette' },
  { label: 'Shopping & retail', value: 'retail', icon: 'i-lucide-shopping-bag' },
  { label: 'Professional services', value: 'services', icon: 'i-lucide-briefcase-business' },
  { label: 'Food & hospitality', value: 'food', icon: 'i-lucide-coffee' },
]

const query = ref('')
const {
  data: directory,
  status: directoryStatus,
  error: directoryError,
  refresh: refreshDirectory,
} = await useFetch<BusinessListResponse>('/api/businesses')
const featuredBusiness = computed(() => directory.value?.items[0] ?? null)
const visibleBusinesses = computed(() => directory.value?.items.slice(0, 6) ?? [])

function searchBusinesses() {
  navigateTo({ path: '/businesses', query: query.value.trim() ? { q: query.value.trim() } : {} })
}
</script>

<template>
  <div>
    <a
      class="fixed -top-24 left-5 z-50 rounded-lg bg-[#143e32] px-5 py-3 text-white focus:top-4"
      href="#main"
      >Skip to content</a
    >
    <LandingHeader />
    <main id="main">
      <section
        class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] grid grid-cols-1 items-center gap-10 pb-11 pt-[53px] lg:grid-cols-[1.15fr_.9fr] lg:gap-6 lg:pb-[82px] lg:pt-[78px] xl:gap-14"
        aria-labelledby="hero-heading"
      >
        <div class="">
          <div
            class="flex items-center gap-2 text-xs font-bold leading-5 tracking-[.125em] text-[#143e32]"
          >
            <span
              class="mr-1 size-[7px] shrink-0 rounded-full bg-[#4b795c] shadow-[0_0_0_5px_#e8eee2]"
            />
            A NEW WAY TO DISCOVER LOCAL
          </div>
          <h1
            id="hero-heading"
            class="relative mb-6 mt-6 whitespace-nowrap text-[clamp(2.8rem,10vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.065em] sm:text-[clamp(3rem,9vw,4.5rem)] lg:text-[clamp(3rem,5vw,4.3rem)] xl:text-[clamp(3.25rem,5.6vw,5rem)]"
          >
            Find businesses<br /><span class="font-normal italic tracking-[-.065em] text-[#143e32]"
              >worth knowing.</span
            ><span
              class="ml-1 mt-1 inline-block align-top text-[28px] leading-none text-[#8da938] sm:ml-2 sm:text-[44px]"
              aria-hidden="true"
              >✳</span
            >
          </h1>
          <p class="mb-7 max-w-[460px] text-base leading-[1.75] text-[#657069] lg:text-lg">
            Your next great find is out there. Discover businesses, get the full picture, and hear
            from the people who’ve been there.
          </p>
          <form
            class="flex max-w-[555px] items-center gap-3 rounded-xl border border-[#cfd8cb] bg-white py-[7px] pl-[18px] pr-[7px] shadow-[0_4px_0_#eef1e8] transition-colors focus-within:border-[#587748]"
            role="search"
            @submit.prevent="searchBusinesses"
          >
            <UIcon
              name="i-lucide-search"
              class="shrink-0 text-xl text-[#627465]"
              aria-hidden="true"
            />
            <label class="sr-only" for="business-search"
              >Search businesses by name or keyword</label
            >
            <input
              id="business-search"
              v-model="query"
              type="search"
              placeholder="A business, a service, a great find…"
              autocomplete="off"
              class="h-12 min-w-0 w-full flex-1 bg-transparent text-sm text-[#172f27] outline-none placeholder:text-[#737c73]"
            />
            <UButton
              type="submit"
              class="!shrink-0 !rounded-lg !bg-[#143e32] !px-3.5 !py-3.5 !text-sm !text-white hover:!bg-[#24563f] sm:!px-[18px]"
              aria-label="Search businesses"
              ><span class="max-[480px]:hidden">Explore</span><UIcon name="i-lucide-arrow-up-right"
            /></UButton>
          </form>
          <div class="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-[#737b73]">
            <span class="font-semibold text-[#47594b]">Made for the curious.</span
            ><span class="mx-1 h-3 w-px bg-[#ccd5c9]" /> Starting in Nigeria
            <span class="flex h-3 w-[18px] overflow-hidden rounded-sm" aria-label="Nigerian flag"
              ><i class="w-1/3 bg-[#287347]" /><i class="w-1/3 bg-white" /><i
                class="w-1/3 bg-[#287347]"
            /></span>
          </div>
        </div>
        <LandingShowcase :business="featuredBusiness" />
      </section>

      <div class="bg-[#d8f36a] border-y border-[#c7df62] py-4">
        <div
          class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm font-semibold text-[#143e32]"
        >
          <span class="inline-flex items-center gap-1.5"
            ><UIcon name="i-lucide-compass" class="text-xl" /> Independent businesses. Fresh
            discoveries.</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><UIcon name="i-lucide-message-circle-heart" class="text-xl" /> Space for honest
            experiences.</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><UIcon name="i-lucide-badge-check" class="text-xl" /> Clear ownership
            information.</span
          >
        </div>
      </div>

      <section
        id="explore"
        class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] py-24 max-md:py-16"
        aria-labelledby="explore-heading"
      >
        <div class="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p
              class="flex items-center gap-2 text-xs font-bold leading-5 tracking-[.125em] text-[#143e32]"
            >
              FOLLOW YOUR CURIOSITY
            </p>
            <h2
              id="explore-heading"
              class="mt-3 text-[clamp(2.4rem,4vw,3.6rem)] font-bold leading-[1.16] tracking-[-.055em]"
            >
              Good finds. <span class="text-[#919c8d]">All kinds.</span>
            </h2>
          </div>
          <p class="max-w-[340px] text-base leading-[1.6] text-[#657069]">
            From the app that simplifies your day<br class="hidden md:block" />
            to the studio that brings your idea to life.
          </p>
        </div>
        <div
          class="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] flex gap-2 overflow-x-auto pb-3 mb-7"
          aria-label="Browse business categories"
        >
          <NuxtLink
            v-for="category in categories"
            :key="category.label"
            :to="
              category.value
                ? { path: '/businesses', query: { category: category.value } }
                : '/businesses'
            "
            class="shrink-0 flex items-center gap-2 rounded-full border border-[#d8ded4] bg-white px-4 py-2.5 text-sm font-semibold text-[#3f5146] transition-all hover:-translate-y-0.5 hover:border-[#143e32]"
            ><UIcon :name="category.icon" />{{ category.label }}</NuxtLink
          >
        </div>
        <div
          class="mb-5 flex flex-wrap justify-between gap-3 border-y border-[#e0e5dd] py-4 text-xs font-semibold tracking-wide text-[#657069]"
        >
          <span class="inline-flex items-center gap-2"
            ><span class="inline-block size-[7px] shrink-0 rounded-full bg-[#4b795c]" /> REAL
            BUSINESSES ON CREDA</span
          >
          <NuxtLink
            to="/businesses"
            class="inline-flex items-center gap-1.5 text-[#315b3a] hover:underline"
            >Explore the directory <UIcon name="i-lucide-arrow-right"
          /></NuxtLink>
        </div>
        <div
          v-if="directoryStatus === 'pending'"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading businesses"
        >
          <div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-xl bg-[#edf2e8]" />
        </div>
        <div
          v-else-if="directoryError"
          class="rounded-2xl border border-[#dfe6dc] bg-white px-7 py-12 text-center"
        >
          <UIcon name="i-lucide-wifi-off" class="text-3xl text-[#6b8a6b]" />
          <h3 class="mt-3 text-xl font-semibold text-[#143e32]">
            We couldn’t load businesses just now.
          </h3>
          <UButton
            color="neutral"
            variant="outline"
            class="mt-5 !rounded-xl"
            @click="refreshDirectory()"
            >Try again</UButton
          >
        </div>
        <div v-else-if="visibleBusinesses.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BusinessCard
            v-for="business in visibleBusinesses"
            :key="business.id"
            :business="business"
          />
        </div>
        <div
          v-else
          class="relative overflow-hidden rounded-2xl border border-[#dfe6dc] bg-[#f0f5e8] px-7 py-14 sm:px-12 sm:py-18"
        >
          <div
            class="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full border border-[#ceddc4]"
            aria-hidden="true"
          />
          <div class="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <span
                class="grid size-14 place-items-center rounded-2xl bg-[#d8f36a] text-2xl text-[#143e32]"
                ><UIcon name="i-lucide-store"
              /></span>
              <h3 class="mt-6 text-3xl font-semibold tracking-[-.05em] text-[#143e32] sm:text-4xl">
                The first good find<br />could be yours.
              </h3>
              <p class="mt-3 max-w-lg text-sm leading-7 text-[#637463]">
                There aren’t any businesses to explore yet. If you own one, create a profile and
                help start the directory.
              </p>
            </div>
            <UButton
              to="/businesses/new"
              class="!rounded-xl !bg-[#143e32] !px-5 !py-3 !font-semibold !text-white"
              trailing-icon="i-lucide-arrow-up-right"
              >List your business</UButton
            >
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        class="bg-[#eff2e9] py-24 max-md:py-16"
        aria-labelledby="how-heading"
      >
        <div class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px]">
          <div class="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p
                class="flex items-center gap-2 text-xs font-bold leading-5 tracking-[.125em] text-[#143e32]"
              >
                A LITTLE CONTEXT GOES A LONG WAY
              </p>
              <h2
                id="how-heading"
                class="mt-3 text-[clamp(2.4rem,4vw,3.6rem)] font-bold leading-[1.16] tracking-[-.055em]"
              >
                Find it. Know it. <span class="font-normal italic tracking-[-.065em]">Try it.</span>
              </h2>
            </div>
            <p class="max-w-[340px] text-base leading-[1.6] text-[#657069]">
              Better choices start with<br class="hidden md:block" />
              knowing a little more.
            </p>
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article class="flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7">
              <div class="flex items-center justify-between mb-8">
                <span
                  class="flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"
                  ><UIcon name="i-lucide-compass" /></span
                ><span class="text-sm font-bold text-[#94a18e]">01</span>
              </div>
              <h3 class="mb-2.5 text-xl font-bold tracking-[-.04em]">Follow a good lead.</h3>
              <p class="text-sm leading-[1.7] text-[#657069]">
                Explore businesses by what they do and where they are. Find something you weren’t
                even looking for.
              </p>
            </article>
            <article class="flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7">
              <div class="flex items-center justify-between mb-8">
                <span
                  class="flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"
                  ><UIcon name="i-lucide-scan-eye" /></span
                ><span class="text-sm font-bold text-[#94a18e]">02</span>
              </div>
              <h3 class="mb-2.5 text-xl font-bold tracking-[-.04em]">Get the fuller picture.</h3>
              <p class="text-sm leading-[1.7] text-[#657069]">
                See business details, check ownership information, and read first-hand customer
                experiences.
              </p>
            </article>
            <article class="flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7">
              <div class="flex items-center justify-between mb-8">
                <span
                  class="flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"
                  ><UIcon name="i-lucide-messages-square" /></span
                ><span class="text-sm font-bold text-[#94a18e]">03</span>
              </div>
              <h3 class="mb-2.5 text-xl font-bold tracking-[-.04em]">Pass your experience on.</h3>
              <p class="text-sm leading-[1.7] text-[#657069]">
                Tried a business? Share what went well and what could be better. Help the next
                person choose.
              </p>
            </article>
          </div>
          <div class="flex items-start gap-3 mt-6 max-w-[790px] text-sm text-[#526457]">
            <UIcon name="i-lucide-badge-info" class="shrink-0 text-xl text-[#64845a]" />
            <p>
              <strong class="text-[#143e32]">Clear signals, honest expectations.</strong> “Ownership
              verified” means we checked who manages a profile. It isn’t a guarantee of service
              quality.
            </p>
          </div>
        </div>
      </section>

      <section
        id="for-businesses"
        class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24 max-md:py-16"
        aria-labelledby="owner-heading"
      >
        <div
          class="relative overflow-hidden rounded-xl bg-[#dfe9d7] min-h-[400px] max-md:min-h-[300px]"
        >
          <img
            class="absolute inset-0 h-full w-full object-cover"
            src="/images/business-owners.png"
            alt="Two creative business owners collaborating in a bright design studio"
            width="1536"
            height="1024"
            loading="lazy"
          />
          <div
            class="absolute left-4 bottom-4 rounded-lg bg-[#d8f36a] px-4 py-3 text-xs font-bold tracking-wide text-[#143e32]"
          >
            <span
              ><UIcon name="i-lucide-sparkles" class="mr-1 align-middle text-[17px]" /> BUILT FOR
              THE ONES BUILDING SOMETHING.</span
            >
          </div>
        </div>
        <div class="max-w-[510px]">
          <p
            class="flex items-center gap-2 text-xs font-bold leading-5 tracking-[.125em] text-[#143e32]"
          >
            SMALL BUSINESS. BIG POSSIBILITY.
          </p>
          <h2
            id="owner-heading"
            class="my-5 text-[clamp(2.7rem,4.4vw,4.2rem)] font-bold leading-[1.18] tracking-[-.06em]"
          >
            You do good work.<br />Let people<br /><span
              class="font-normal italic tracking-[-.065em]"
              >get to know it.</span
            >
          </h2>
          <p class="text-[17px] leading-[1.7] text-[#657069]">
            Give your business a home beyond a social feed. One shareable profile for your story,
            your links, and your customers’ experiences.
          </p>
          <ul class="flex flex-col gap-3 my-7">
            <li class="flex items-center gap-2.5 text-sm font-semibold">
              <UIcon name="i-lucide-check" class="text-lg text-[#4b805f]" /> Your business, in one
              place
            </li>
            <li class="flex items-center gap-2.5 text-sm font-semibold">
              <UIcon name="i-lucide-check" class="text-lg text-[#4b805f]" /> Customer feedback you
              can respond to
            </li>
            <li class="flex items-center gap-2.5 text-sm font-semibold">
              <UIcon name="i-lucide-check" class="text-lg text-[#4b805f]" /> A link worth sharing
            </li>
          </ul>
          <UButton
            class="!bg-[#143e32] !text-white !rounded-lg !px-5 !py-3 !font-semibold hover:!bg-[#24563f]"
            trailing-icon="i-lucide-arrow-up-right"
            to="/businesses/new"
            >List your business</UButton
          ><span class="block mt-3 text-xs text-[#657069]"
            >Create a profile people can discover and share.</span
          >
        </div>
      </section>

      <section
        class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] flex flex-wrap items-center justify-between gap-7 rounded-xl bg-[#143e32] px-9 py-12 max-md:px-6 text-white"
      >
        <span class="text-5xl text-[#d8f36a]" aria-hidden="true">✳</span>
        <div class="min-w-[245px] flex-1">
          <p class="mb-2 text-sm opacity-70">There’s a whole world of good businesses.</p>
          <h2 class="text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.2] tracking-[-.055em]">
            Go find
            <span class="font-normal italic tracking-[-.065em] text-[#d8f36a]">your people.</span>
          </h2>
        </div>
        <UButton
          to="#explore"
          class="!bg-[#d8f36a] !text-[#143e32] !rounded-lg !px-5 !py-3 !font-semibold"
          trailing-icon="i-lucide-arrow-up-right"
          >Start exploring</UButton
        >
      </section>
    </main>
    <footer
      class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-[1240px] flex flex-wrap items-center justify-between gap-5 py-12 text-sm text-[#657069]"
    >
      <LandingLogo compact />
      <p>Good businesses deserve to be known.</p>
      <span>Starting in Nigeria. Built for discovery.</span
      ><a
        href="#"
        aria-label="Back to top"
        class="grid size-[35px] place-items-center rounded-full border border-[#e0e5dd] text-[#143e32]"
        ><UIcon name="i-lucide-arrow-up"
      /></a>
    </footer>
  </div>
</template>

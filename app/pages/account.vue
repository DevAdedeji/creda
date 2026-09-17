<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import type { ManagedBusiness } from '~~/shared/businesses'

useSeoMeta({ title: 'Your account — Creda', robots: 'noindex, nofollow' })

const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const {
  data: owned,
  error: ownedError,
  refresh: refreshOwned,
} = await useFetch<{ items: ManagedBusiness[] }>('/api/my/businesses', {
  immediate: Boolean(session.value),
})
const firstName = computed(() => session.value?.user.name.trim().split(/\s+/)[0] || 'there')
const recentBusinesses = computed(() => owned.value?.items.slice(0, 2) ?? [])
</script>

<template>
  <div class="min-h-screen bg-[#f7f9f3] text-[#172f27]">
    <LandingHeader />
    <main
      v-if="session"
      class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-6xl pb-20 pt-9 sm:pt-14"
      aria-labelledby="account-heading"
    >
      <p class="mb-7 text-xs font-bold tracking-[.17em] text-[#55725b]">YOUR SPACE ON CREDA</p>

      <section
        class="relative overflow-hidden rounded-[28px] bg-[#143e32] px-7 py-10 text-white sm:px-12 sm:py-14"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-28 size-80 rounded-full border border-white/10 sm:size-[30rem]"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute -bottom-52 right-20 size-80 rounded-full border border-white/10 sm:size-[30rem]"
          aria-hidden="true"
        />
        <span
          class="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[.13em] text-[#d8f36a]"
          ><UIcon name="i-lucide-sparkles" /> A PLACE FOR GOOD FINDS</span
        >
        <div class="relative mt-8 flex flex-wrap items-end justify-between gap-8">
          <div class="max-w-2xl">
            <h1
              id="account-heading"
              class="text-[clamp(2.6rem,5vw,4.4rem)] font-semibold leading-[1.04] tracking-[-.07em]"
            >
              Welcome back,<br /><span class="text-[#d8f36a]">{{ firstName }}.</span>
            </h1>
            <p class="mt-5 max-w-lg text-base leading-7 text-[#d3e0d6]">
              Find your next favourite business, or give your own business a place to be discovered.
            </p>
          </div>
          <NuxtLink
            to="/businesses"
            class="inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-5 py-3 text-sm font-bold text-[#143e32] transition hover:bg-[#e5fa91]"
            >Explore businesses <UIcon name="i-lucide-arrow-up-right"
          /></NuxtLink>
        </div>
      </section>

      <div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div class="space-y-6">
          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
            aria-labelledby="businesses-heading"
          >
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold tracking-[.13em] text-[#69836b]">YOUR WORK ON CREDA</p>
                <h2
                  id="businesses-heading"
                  class="mt-2 text-2xl font-semibold tracking-[-.04em] text-[#143e32]"
                >
                  Your businesses
                </h2>
              </div>
              <NuxtLink
                to="/dashboard/businesses"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#315b3a] hover:underline"
                >Manage all <UIcon name="i-lucide-arrow-right"
              /></NuxtLink>
            </div>
            <div
              v-if="!session.user.emailVerified"
              class="mt-6 rounded-xl bg-[#f7f2e7] px-5 py-6 text-sm leading-6 text-[#7a6334]"
            >
              Check your inbox and verify your email before listing a business.
            </div>
            <div v-else-if="ownedError" class="mt-6 rounded-xl bg-[#f5f8f1] px-5 py-6">
              <p class="text-sm text-[#657069]">We couldn’t load your businesses right now.</p>
              <UButton
                color="neutral"
                variant="outline"
                class="mt-4 !rounded-lg"
                @click="refreshOwned()"
                >Try again</UButton
              >
            </div>
            <div
              v-else-if="recentBusinesses.length"
              class="mt-6 divide-y divide-[#edf0e9] border-y border-[#edf0e9]"
            >
              <NuxtLink
                v-for="item in recentBusinesses"
                :key="item.id"
                :to="
                  item.status === 'approved'
                    ? '/businesses/' + item.slug
                    : '/dashboard/businesses/' + item.id + '/edit'
                "
                class="group flex items-center gap-4 py-4"
              >
                <img
                  v-if="item.logoUrl"
                  :src="item.logoUrl"
                  alt=""
                  referrerpolicy="no-referrer"
                  class="size-12 rounded-xl border border-[#e1e7dc] object-cover"
                  width="48"
                  height="48"
                />
                <span
                  v-else
                  class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-lg font-bold text-[#315b3a]"
                  >{{ item.name.charAt(0).toUpperCase() }}</span
                >
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-[#143e32]">{{ item.name }}</p>
                  <p class="mt-0.5 text-sm text-[#708071]">{{ item.location || 'Online' }}</p>
                </div>
                <UIcon
                  v-if="item.ownershipStatus === 'verified'"
                  name="i-lucide-badge-check"
                  class="text-lg text-[#4b8b56]"
                  aria-label="Ownership verified"
                />
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="text-lg text-[#829483] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </NuxtLink>
            </div>
            <div v-else class="mt-6 rounded-xl bg-[#f5f8f1] px-5 py-7">
              <span
                class="grid size-11 place-items-center rounded-xl bg-[#e2efd8] text-xl text-[#356549]"
                ><UIcon name="i-lucide-store"
              /></span>
              <p class="mt-4 font-semibold text-[#143e32]">Put your business on the map.</p>
              <p class="mt-1 max-w-md text-sm leading-6 text-[#657069]">
                Create a shareable profile that helps people find what you do and where to reach
                you.
              </p>
            </div>
            <NuxtLink
              v-if="session.user.emailVerified"
              to="/businesses/new"
              class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#143e32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24563f]"
              >List a business <UIcon name="i-lucide-arrow-right"
            /></NuxtLink>
          </section>
          <NuxtLink
            to="/businesses"
            class="group flex items-center gap-5 rounded-2xl border border-[#dfe6dc] bg-[#e7efdE] p-6 transition hover:border-[#b8ccb0] sm:p-8"
          >
            <span
              class="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-2xl text-[#315b3a]"
              ><UIcon name="i-lucide-compass"
            /></span>
            <span class="flex-1"
              ><strong class="block text-lg text-[#143e32]">There’s more to discover.</strong
              ><span class="mt-1 block text-sm text-[#657069]"
                >Browse businesses and find something worth sharing.</span
              ></span
            >
            <UIcon
              name="i-lucide-arrow-up-right"
              class="text-xl text-[#315b3a] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </NuxtLink>
        </div>
        <aside
          class="self-start overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white"
          aria-labelledby="details-heading"
        >
          <div class="border-b border-[#edf0e9] p-6 sm:p-7">
            <p class="text-xs font-bold tracking-[.13em] text-[#69836b]">ACCOUNT DETAILS</p>
            <h2 id="details-heading" class="mt-2 text-xl font-semibold text-[#143e32]">
              Your profile
            </h2>
          </div>
          <div class="p-6 sm:p-7">
            <div class="flex items-center gap-3">
              <img
                v-if="session.user.image"
                :src="session.user.image"
                alt=""
                referrerpolicy="no-referrer"
                class="size-12 rounded-full object-cover"
                width="48"
                height="48"
              />
              <span
                v-else
                class="grid size-12 place-items-center rounded-full bg-[#d8f36a] text-lg font-bold text-[#143e32]"
                >{{ session.user.name.charAt(0).toUpperCase() }}</span
              >
              <div class="min-w-0">
                <p class="truncate font-semibold text-[#143e32]">{{ session.user.name }}</p>
                <p class="truncate text-sm text-[#758577]">Creda member</p>
              </div>
            </div>
            <div class="mt-7 border-t border-[#edf0e9] pt-6">
              <p class="text-xs font-semibold uppercase tracking-[.12em] text-[#829084]">
                Email address
              </p>
              <p class="mt-2 break-all text-sm font-medium text-[#243d30]">
                {{ session.user.email }}
              </p>
            </div>
            <div class="mt-6 border-t border-[#edf0e9] pt-6">
              <p class="text-xs font-semibold uppercase tracking-[.12em] text-[#829084]">
                Email verification
              </p>
              <p
                class="mt-2 inline-flex items-center gap-2 text-sm font-semibold"
                :class="session.user.emailVerified ? 'text-[#36724b]' : 'text-[#9a7032]'"
              >
                <UIcon
                  :name="
                    session.user.emailVerified ? 'i-lucide-circle-check' : 'i-lucide-mail-warning'
                  "
                  class="text-lg"
                />{{ session.user.emailVerified ? 'Verified' : 'Check your inbox' }}
              </p>
              <p v-if="!session.user.emailVerified" class="mt-2 text-xs leading-5 text-[#758577]">
                Verify your email before listing a business.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

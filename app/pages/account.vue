<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import type { ManagedBusinessListResponse } from '~~/shared/businesses'

useSeoMeta({ title: 'Your account — Creda', robots: 'noindex, nofollow' })

const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const {
  data: owned,
  error: ownedError,
  refresh: refreshOwned,
} = await useFetch<ManagedBusinessListResponse>('/api/my/businesses', {
  immediate: Boolean(session.value),
})
const firstName = computed(() => session.value?.user.name.trim().split(/\s+/)[0] || 'there')
const recentBusinesses = computed(() => owned.value?.items.slice(0, 2) ?? [])
</script>

<template>
  <WorkspaceShell>
    <main
      v-if="session"
      class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-6xl pb-20 pt-9 sm:pt-14"
      aria-labelledby="account-heading"
    >
      <p class="text-xs font-medium text-[#79877c]">
        Your space <span class="mx-2 text-[#b4c0b4]">/</span> Overview
      </p>
      <div
        class="mt-7 flex flex-wrap items-end justify-between gap-6 border-b border-[#e4e9e0] pb-8"
      >
        <div>
          <h1
            id="account-heading"
            class="text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl"
          >
            Welcome back, {{ firstName }}<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-[#657069] sm:text-base">
            Your businesses and saved finds in one place.
          </p>
        </div>
        <NuxtLink
          to="/businesses"
          class="inline-flex items-center gap-2 rounded-full bg-[#d8f36a] px-5 py-3 text-sm font-bold text-[#143e32] transition hover:bg-[#c8ec52]"
        >
          Explore businesses <UIcon name="i-lucide-arrow-up-right" />
        </NuxtLink>
      </div>

      <div class="mt-8 space-y-6">
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
                  : item.status === 'suspended'
                    ? '/dashboard/businesses'
                    : '/dashboard/businesses/' + item.id + '/edit'
              "
              class="group flex items-center gap-4 py-4"
            >
              <NuxtImg
                v-if="item.logoUrl"
                :src="item.logoUrl"
                alt=""
                class="size-12 rounded-xl border border-[#e1e7dc] object-cover"
                width="48"
                height="48"
                format="webp"
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
              Create a shareable profile that helps people find what you do and where to reach you.
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
          to="/saved"
          class="group flex items-center gap-5 rounded-2xl border border-[#dfe6dc] bg-white p-6 transition hover:border-[#b8ccb0] sm:p-8"
        >
          <span
            class="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e8f4da] text-2xl text-[#315b3a]"
            ><UIcon name="i-lucide-bookmark"
          /></span>
          <span class="flex-1"
            ><strong class="block text-lg text-[#143e32]">Your saved businesses</strong
            ><span class="mt-1 block text-sm text-[#657069]"
              >Pick up where you left off with the places you saved.</span
            ></span
          >
          <UIcon name="i-lucide-arrow-up-right" class="text-xl text-[#315b3a]" />
        </NuxtLink>
      </div>
    </main>
  </WorkspaceShell>
</template>

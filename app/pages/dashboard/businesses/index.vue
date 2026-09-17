<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import type { ManagedBusiness } from '~~/shared/businesses'

useSeoMeta({ title: 'Your businesses — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const { data, status, error, refresh } = await useFetch<{ items: ManagedBusiness[] }>(
  '/api/my/businesses',
)
</script>

<template>
  <div class="min-h-screen bg-[#f7f9f3] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-5xl py-12 sm:py-16">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">YOUR BUSINESS PROFILES</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Your businesses.
          </h1>
          <p class="mt-3 max-w-xl text-[#657069]">
            Manage the businesses you’ve shared with Creda.
          </p>
        </div>
        <UButton
          to="/businesses/new"
          size="lg"
          class="!rounded-xl !bg-[#143e32] !px-5 !text-white"
          trailing-icon="i-lucide-arrow-right"
          >List a business</UButton
        >
      </div>

      <p
        v-if="route.query.submitted === '1'"
        role="status"
        class="mt-8 rounded-xl bg-[#e8f4da] p-4 text-sm font-medium text-[#315b3a]"
      >
        Your business is live in the directory. You can update its details anytime.
      </p>
      <div
        v-if="status === 'pending'"
        class="mt-10 grid gap-4"
        aria-label="Loading your businesses"
      >
        <div v-for="n in 2" :key="n" class="h-32 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <div v-else-if="error" class="mt-10 rounded-2xl border border-red-200 bg-white p-7">
        <p class="text-sm text-red-800">We could not load your listings.</p>
        <UButton class="mt-4" color="neutral" variant="outline" @click="refresh()"
          >Try again</UButton
        >
      </div>
      <div
        v-else-if="!data?.items.length"
        class="mt-10 rounded-2xl border border-[#dfe6dc] bg-white p-8 sm:p-12"
      >
        <span
          class="grid size-14 place-items-center rounded-2xl bg-[#e8f4da] text-2xl text-[#315b3a]"
          ><UIcon name="i-lucide-store"
        /></span>
        <h2 class="mt-5 text-2xl font-semibold tracking-tight text-[#143e32]">
          No business profiles yet.
        </h2>
        <p class="mt-2 max-w-lg text-sm leading-6 text-[#657069]">
          Tell us about a business you own or represent. It will have a public page people can find
          and share right away.
        </p>
        <UButton to="/businesses/new" class="mt-6 !rounded-xl !bg-[#143e32] !text-white"
          >Create a listing</UButton
        >
      </div>
      <div v-else class="mt-10 grid gap-4">
        <article
          v-for="item in data.items"
          :key="item.id"
          class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-7"
        >
          <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <img
                v-if="item.logoUrl"
                :src="item.logoUrl"
                alt=""
                class="size-14 shrink-0 rounded-xl border border-[#e1e7dc] object-cover"
                width="56"
                height="56"
              />
              <span
                v-else
                class="grid size-14 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-xl font-bold text-[#315b3a]"
                >{{ item.name.charAt(0).toUpperCase() }}</span
              >
              <div class="min-w-0">
                <h2 class="text-xl font-semibold text-[#143e32]">{{ item.name }}</h2>
                <p class="mt-1 text-sm text-[#657069]">{{ item.location || 'Online' }}</p>
                <NuxtLink
                  :to="'/dashboard/businesses/' + item.id + '/verification'"
                  class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#315b3a] hover:underline"
                >
                  <UIcon
                    :name="
                      item.ownershipStatus === 'verified'
                        ? 'i-lucide-badge-check'
                        : 'i-lucide-shield-check'
                    "
                  />
                  {{
                    item.ownershipStatus === 'verified' ? 'Ownership verified' : 'Verify ownership'
                  }}
                </NuxtLink>
              </div>
            </div>
            <div class="flex flex-wrap justify-end gap-2 md:ml-auto md:shrink-0">
              <UButton
                :to="'/businesses/' + item.slug"
                color="neutral"
                variant="outline"
                class="!rounded-lg"
                trailing-icon="i-lucide-arrow-up-right"
                >View public profile</UButton
              >
              <UButton
                :to="'/dashboard/businesses/' + item.id + '/edit'"
                color="neutral"
                variant="outline"
                class="!rounded-lg"
                trailing-icon="i-lucide-pencil"
                >Edit listing</UButton
              >
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

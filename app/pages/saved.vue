<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import { apiErrorMessage } from '@/utils/apiError'
import type { BusinessListItem } from '~~/shared/businesses'

useSeoMeta({ title: 'Saved businesses — Creda', robots: 'noindex, nofollow' })
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')
const page = ref(1)
const { data, status, error, refresh } = await useFetch<{
  items: (BusinessListItem & { savedAt: string })[]
  page: number
  pageSize: number
  total: number
}>('/api/my/saved-businesses', {
  query: { page },
  immediate: Boolean(session.value?.user.emailVerified),
})
const removingId = ref<string | null>(null)
const appToast = useAppToast()

async function remove(id: string) {
  if (removingId.value) return
  removingId.value = id
  try {
    await $fetch<{ saved: boolean }>(`/api/my/saved-businesses/${id}`, { method: 'DELETE' })
    if (data.value?.items.length === 1 && page.value > 1) page.value--
    else await refresh()
    appToast.success('Business removed from saved')
  } catch (error) {
    appToast.error('Could not remove this business', apiErrorMessage(error, 'Please try again.'))
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14 xl:px-12">
      <p class="text-xs font-medium text-[#79877c]">
        Your space <span class="mx-2 text-[#b4c0b4]">/</span> Saved businesses
      </p>
      <div
        class="mt-7 flex flex-wrap items-end justify-between gap-5 border-b border-[#e4e9e0] pb-8"
      >
        <div>
          <p class="text-xs font-bold uppercase tracking-[.17em] text-[#65836a]">YOUR SHORTLIST</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Saved businesses<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-3 max-w-xl text-[#647367]">
            Keep the good finds close while you decide where to go next.
          </p>
        </div>
        <UButton to="/explore" icon="i-lucide-compass" class="!rounded-xl !bg-[#143e32] !text-white"
          >Explore more</UButton
        >
      </div>
      <div
        v-if="!session?.user.emailVerified"
        class="mt-10 rounded-2xl border border-[#dfe6dc] bg-white p-8"
      >
        <p class="font-semibold text-[#143e32]">Verify your email to save businesses.</p>
        <p class="mt-2 text-sm text-[#647367]">
          Check your inbox for the verification link, then come back here.
        </p>
      </div>
      <div
        v-else-if="status === 'pending'"
        class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading saved businesses"
      >
        <div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <div v-else-if="error" class="mt-10 rounded-2xl border border-red-200 bg-white p-8">
        <p class="font-semibold text-red-800">We couldn’t load your saved businesses.</p>
        <UButton variant="outline" class="mt-4" @click="refresh()">Try again</UButton>
      </div>
      <div
        v-else-if="!data?.items.length"
        class="mt-10 rounded-3xl border border-dashed border-[#cbdac6] bg-white px-7 py-14 text-center"
      >
        <span
          class="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e8f4da] text-3xl text-[#315e42]"
          ><UIcon name="i-lucide-bookmark"
        /></span>
        <h2 class="mt-5 text-2xl font-semibold text-[#143e32]">Your shortlist starts here.</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657069]">
          Explore the directory and save businesses you want to revisit.
        </p>
        <UButton to="/explore" class="mt-6 !rounded-xl !bg-[#143e32] !text-white"
          >Browse businesses</UButton
        >
      </div>
      <div v-else class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in data.items"
          :key="item.id"
          class="overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white transition hover:border-[#b9cdb4] hover:shadow-[0_14px_35px_#143e3212]"
        >
          <NuxtLink :to="`/businesses/${item.slug}`" class="block p-6">
            <div class="flex items-start justify-between">
              <NuxtImg
                v-if="item.logoUrl"
                :src="item.logoUrl"
                alt=""
                width="56"
                height="56"
                format="webp"
                class="size-14 rounded-xl object-cover"
              />
              <span
                v-else
                class="grid size-14 place-items-center rounded-xl bg-[#e4f2d8] text-xl font-bold text-[#315b3a]"
                >{{ item.name.charAt(0).toUpperCase() }}</span
              >
              <UIcon name="i-lucide-arrow-up-right" class="text-xl text-[#65836a]" />
            </div>
            <h2 class="mt-5 text-xl font-semibold text-[#143e32]">{{ item.name }}</h2>
            <p class="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#657069]">
              {{ item.description }}
            </p>
            <div class="mt-4 flex items-center gap-2 text-xs font-medium text-[#5b715f]">
              <UIcon name="i-lucide-map-pin" /> {{ item.location || 'Online'
              }}<span v-if="item.reviewCount" class="ml-auto text-[#916922]"
                >★ {{ item.averageRating }} ({{ item.reviewCount }})</span
              >
            </div>
          </NuxtLink>
          <div class="flex items-center justify-between border-t border-[#edf0e9] px-6 py-3">
            <span class="text-xs text-[#819184]"
              >Saved
              {{
                new Date(item.savedAt).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })
              }}</span
            >
            <UButton
              color="neutral"
              variant="link"
              icon="i-lucide-bookmark-x"
              :loading="removingId === item.id"
              class="!px-0 !text-[#6a796d] hover:!text-red-700"
              @click="remove(item.id)"
              >Remove</UButton
            >
          </div>
        </article>
      </div>
      <nav
        v-if="data && data.total > data.pageSize"
        aria-label="Saved business pages"
        class="mt-10 flex items-center justify-between gap-3"
      >
        <UButton
          color="neutral"
          variant="outline"
          :disabled="page <= 1"
          icon="i-lucide-arrow-left"
          @click="page--"
          >Previous</UButton
        >
        <span class="text-sm text-[#657069]"
          >Page {{ page }} of {{ Math.ceil(data.total / data.pageSize) }}</span
        >
        <UButton
          color="neutral"
          variant="outline"
          :disabled="page * data.pageSize >= data.total"
          trailing-icon="i-lucide-arrow-right"
          @click="page++"
          >Next</UButton
        >
      </nav>
    </main>
  </WorkspaceShell>
</template>

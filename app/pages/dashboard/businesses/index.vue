<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import type { ManagedBusinessListResponse } from '~~/shared/businesses'

useSeoMeta({ title: 'Your businesses — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const toast = useToast()
const siteOrigin = new URL(useCanonicalUrl('/')).origin
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const page = computed(() => {
  const requested = typeof route.query.page === 'string' ? Number(route.query.page) : 1
  return Number.isInteger(requested) && requested >= 1 && requested <= 10000 ? requested : 1
})
const { data, status, error, refresh } = await useFetch<ManagedBusinessListResponse>(
  '/api/my/businesses',
  { query: computed(() => ({ page: page.value })) },
)

function pageLink(nextPage: number) {
  return {
    path: '/dashboard/businesses',
    query: {
      ...route.query,
      submitted: undefined,
      page: nextPage === 1 ? undefined : String(nextPage),
    },
  }
}

function bioLink(slug: string) {
  return new URL('/' + encodeURIComponent(slug), siteOrigin)
}

async function copyBioLink(slug: string) {
  try {
    await navigator.clipboard.writeText(bioLink(slug).toString())
    toast.add({ title: 'Business page link copied', color: 'success' })
  } catch {
    toast.add({ title: 'Could not copy the link', color: 'error' })
  }
}

watch(
  () => data.value?.page,
  (resolvedPage) => {
    if (resolvedPage && resolvedPage !== page.value) {
      void navigateTo(pageLink(resolvedPage), { replace: true })
    }
  },
)
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <p class="text-xs font-medium text-[#79877c]">
        Your space <span class="mx-2 text-[#b4c0b4]">/</span> Your businesses
      </p>
      <div
        class="mt-7 flex flex-wrap items-end justify-between gap-6 border-b border-[#e4e9e0] pb-8"
      >
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
        class="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Loading your businesses"
      >
        <div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
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
      <div v-else class="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in data.items"
          :key="item.id"
          class="flex flex-col overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white transition hover:border-[#b9cdb4] hover:shadow-[0_14px_35px_#143e3212]"
        >
          <div class="flex-1 p-6">
            <div class="flex items-start justify-between gap-3">
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
              <UIcon
                v-if="item.ownershipStatus === 'verified'"
                name="i-lucide-badge-check"
                class="text-xl text-[#4b8b56]"
                aria-label="Ownership verified"
              />
            </div>
            <h2 class="mt-5 line-clamp-2 text-xl font-semibold text-[#143e32]">
              {{ item.name }}
            </h2>
            <p class="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#657069]">
              {{ item.description }}
            </p>
            <p class="mt-4 flex items-center gap-2 text-xs font-medium text-[#5b715f]">
              <UIcon name="i-lucide-map-pin" class="shrink-0" />
              <span class="truncate">{{ item.location || 'Online' }}</span>
            </p>
            <p
              v-if="item.status === 'suspended'"
              class="mt-5 text-sm font-medium leading-6 text-amber-800"
            >
              This listing is unavailable following a content review. Changes are paused until an
              administrator restores it.
            </p>
            <NuxtLink
              v-else
              :to="'/dashboard/businesses/' + item.id + '/verification'"
              class="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#315b3a] hover:underline"
            >
              <UIcon
                :name="
                  item.ownershipStatus === 'verified'
                    ? 'i-lucide-badge-check'
                    : 'i-lucide-shield-check'
                "
                class="text-base"
              />
              {{ item.ownershipStatus === 'verified' ? 'Ownership verified' : 'Verify ownership' }}
            </NuxtLink>
            <div
              v-if="item.status === 'approved'"
              class="mt-5 flex items-center gap-3 rounded-xl border border-[#e2ebde] bg-[#f6faf3] px-3 py-2.5"
            >
              <UIcon name="i-lucide-link-2" class="shrink-0 text-[#4c7653]" />
              <div class="min-w-0 flex-1">
                <p class="text-[10px] font-bold uppercase tracking-[.12em] text-[#69806c]">
                  Your shareable page
                </p>
                <p class="truncate text-xs font-semibold text-[#254c37]">
                  {{ bioLink(item.slug).host }}{{ bioLink(item.slug).pathname }}
                </p>
              </div>
              <button
                type="button"
                :aria-label="`Copy ${item.name} business page link`"
                class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d2e1cf] bg-white px-2.5 text-xs font-semibold text-[#315b3a] transition hover:bg-[#e9f4e4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
                @click="copyBioLink(item.slug)"
              >
                <UIcon name="i-lucide-copy" class="text-base" /> Copy
              </button>
            </div>
          </div>
          <div
            v-if="item.status !== 'suspended'"
            class="flex flex-wrap justify-end gap-x-5 gap-y-2 border-t border-[#edf0e9] px-6 py-4"
          >
            <NuxtLink
              v-if="item.status === 'approved'"
              :to="'/businesses/' + item.slug"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315b3a] hover:underline"
            >
              View profile <UIcon name="i-lucide-arrow-up-right" class="text-base" />
            </NuxtLink>
            <NuxtLink
              :to="'/dashboard/businesses/' + item.id + '/edit'"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315b3a] hover:underline"
            >
              Edit listing <UIcon name="i-lucide-pencil" class="text-sm" />
            </NuxtLink>
          </div>
        </article>
      </div>
      <nav
        v-if="status === 'success' && data && data.total > data.pageSize"
        aria-label="Your business pages"
        class="mt-10 flex flex-wrap items-center justify-between gap-3"
      >
        <UButton
          :to="data.page > 1 ? pageLink(data.page - 1) : undefined"
          :disabled="data.page <= 1"
          size="sm"
          color="neutral"
          variant="outline"
          class="!rounded-lg"
          icon="i-lucide-arrow-left"
          >Previous</UButton
        >
        <UPagination
          :page="data.page"
          :total="data.total"
          :items-per-page="data.pageSize"
          :sibling-count="1"
          :show-controls="false"
          :to="pageLink"
          class="hidden sm:flex"
        />
        <span class="text-sm text-[#657069] sm:hidden">
          Page {{ data.page }} of {{ Math.ceil(data.total / data.pageSize) }}
        </span>
        <UButton
          :to="data.page * data.pageSize < data.total ? pageLink(data.page + 1) : undefined"
          :disabled="data.page * data.pageSize >= data.total"
          size="sm"
          color="neutral"
          variant="outline"
          class="!rounded-lg"
          trailing-icon="i-lucide-arrow-right"
          >Next</UButton
        >
      </nav>
    </main>
  </WorkspaceShell>
</template>

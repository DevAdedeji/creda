<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'
import { insightLinkLabels, type BusinessInsights, type InsightRange } from '~~/shared/insights'
import { apiErrorMessage } from '@/utils/apiError'

useSeoMeta({ title: 'Business insights — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')
const range = computed<InsightRange>(() => (route.query.days === '30' ? 30 : 7))
const { data, status, error, refresh } = await useFetch<BusinessInsights>(
  () => `/api/my/businesses/${encodeURIComponent(String(route.params.id))}/insights`,
  { query: computed(() => ({ days: String(range.value) })) },
)
watch(
  () => session.value?.user.id,
  (userId, previousUserId) => {
    if (userId === previousUserId) return
    data.value = undefined
    void navigateTo('/dashboard/businesses')
  },
)
const linkCounts = computed(() =>
  Object.entries(insightLinkLabels).map(([key, label]) => ({
    label,
    count: data.value?.metrics[key as keyof typeof insightLinkLabels] ?? 0,
  })),
)
const totalClicks = computed(() => linkCounts.value.reduce((sum, item) => sum + item.count, 0))
const maxClicks = computed(() => Math.max(1, ...linkCounts.value.map((item) => item.count)))
const formatNumber = (value: number) => new Intl.NumberFormat('en-NG').format(value)
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  )
function selectRange(days: InsightRange) {
  void navigateTo(
    { path: route.path, query: { ...route.query, days: days === 7 ? undefined : '30' } },
    { replace: true },
  )
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <NuxtLink
        to="/dashboard/businesses"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#47644d] hover:underline"
        ><UIcon name="i-lucide-arrow-left" />Your businesses</NuxtLink
      >
      <div
        class="mt-7 flex flex-wrap items-end justify-between gap-6 border-b border-[#e4e9e0] pb-8"
      >
        <div>
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">BUSINESS INSIGHTS</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            See what’s connecting.
          </h1>
          <p class="mt-3 text-[#657069]">
            Understand how people discover and engage with your business.
          </p>
        </div>
        <div
          class="flex rounded-xl border border-[#dfe6dc] bg-white p-1"
          role="group"
          aria-label="Insights date range"
        >
          <UButton
            v-for="days in [7, 30] as const"
            :key="days"
            color="neutral"
            :variant="range === days ? 'solid' : 'ghost'"
            :aria-pressed="range === days"
            class="!rounded-lg !px-4"
            :class="range === days ? '!bg-[#143e32] !text-white' : '!text-[#526659]'"
            @click="selectRange(days)"
            >Last {{ days }} days</UButton
          >
        </div>
      </div>
      <div
        v-if="status === 'pending'"
        class="mt-8 space-y-6"
        role="status"
        aria-label="Loading business insights"
      >
        <div class="h-14 animate-pulse rounded-xl bg-[#e8eee4]" />
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-2xl bg-[#e8eee4]" />
        </div>
        <div class="h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <div
        v-else-if="error || !data"
        class="mt-8 rounded-2xl border border-red-200 bg-white p-7"
        role="alert"
      >
        <h2 class="font-semibold text-[#143e32]">Insights are unavailable.</h2>
        <p class="mt-2 text-sm text-red-800">
          {{ apiErrorMessage(error, 'We could not load these insights. Please try again.') }}
        </p>
        <UButton color="neutral" variant="outline" class="mt-5" @click="refresh()"
          >Try again</UButton
        >
      </div>
      <template v-else>
        <div class="my-8 flex flex-wrap items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <NuxtImg
              v-if="data.business.logoUrl"
              :src="data.business.logoUrl"
              alt=""
              width="44"
              height="44"
              class="size-11 rounded-xl object-cover"
            /><span
              v-else
              class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e8f4da] font-semibold text-[#315b3a]"
              >{{ data.business.name.charAt(0) }}</span
            >
            <div class="min-w-0">
              <h2 class="truncate font-semibold text-[#143e32]">{{ data.business.name }}</h2>
              <p class="mt-1 text-xs text-[#657069]">
                {{ formatDate(data.from) }} – {{ formatDate(data.through) }} · UTC, including today
              </p>
            </div>
          </div>
          <UButton
            :to="'/businesses/' + data.business.slug"
            color="neutral"
            variant="outline"
            size="sm"
            trailing-icon="i-lucide-arrow-up-right"
            >View profile</UButton
          >
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <section class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6">
            <UIcon name="i-lucide-eye" class="size-5 text-[#52734e]" />
            <h3 class="mt-4 text-sm text-[#657069]">Page views</h3>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-[#143e32]">
              {{ formatNumber(data.metrics.profile_view + data.metrics.bio_view) }}
            </p>
            <p class="mt-2 text-xs leading-5 text-[#657069]">
              {{ formatNumber(data.metrics.profile_view) }} profile ·
              {{ formatNumber(data.metrics.bio_view) }} bio-link
            </p>
          </section>
          <section class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6">
            <UIcon name="i-lucide-mouse-pointer-2" class="size-5 text-[#52734e]" />
            <h3 class="mt-4 text-sm text-[#657069]">Link clicks</h3>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-[#143e32]">
              {{ formatNumber(totalClicks) }}
            </p>
            <p class="mt-2 text-xs leading-5 text-[#657069]">Across your business links</p>
          </section>
          <section class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6">
            <UIcon name="i-lucide-bookmark" class="size-5 text-[#52734e]" />
            <h3 class="mt-4 text-sm text-[#657069]">Saved by people</h3>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-[#143e32]">
              {{ formatNumber(data.saves) }}
            </p>
            <p class="mt-2 text-xs leading-5 text-[#657069]">Current total · all time</p>
          </section>
          <section class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6">
            <UIcon name="i-lucide-message-square" class="size-5 text-[#52734e]" />
            <h3 class="mt-4 text-sm text-[#657069]">New reviews</h3>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-[#143e32]">
              {{ formatNumber(data.newReviews) }}
            </p>
            <p class="mt-2 text-xs leading-5 text-[#657069]">
              Published reviews added in this period
            </p>
          </section>
        </div>
        <div class="mt-6"><InsightsActivityChart :activity="data.activity" /></div>
        <div class="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
            <h2 class="text-lg font-semibold text-[#143e32]">Where people go next</h2>
            <p class="mt-1 text-sm text-[#657069]">Clicks from your profile and bio-link page.</p>
            <div class="mt-6 space-y-4">
              <div v-for="link in linkCounts" :key="link.label">
                <div class="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span class="text-[#526659]">{{ link.label }}</span
                  ><span class="font-semibold tabular-nums text-[#143e32]">{{
                    formatNumber(link.count)
                  }}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-[#eff3eb]" aria-hidden="true">
                  <div
                    class="h-full rounded-full bg-[#8cae61]"
                    :style="{ width: `${(link.count / maxClicks) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </section>
          <div class="space-y-6">
            <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
              <h2 class="text-lg font-semibold text-[#143e32]">Your reputation</h2>
              <div class="mt-6 flex items-center gap-3">
                <UIcon name="i-lucide-star" class="size-7 text-[#c99536]" />
                <p class="text-4xl font-semibold tracking-tight text-[#143e32]">
                  {{ data.averageRating === null ? '—' : data.averageRating.toFixed(1)
                  }}<span
                    v-if="data.averageRating !== null"
                    class="ml-1 text-base font-normal text-[#657069]"
                    >/ 5</span
                  >
                </p>
              </div>
              <p class="mt-3 text-sm leading-6 text-[#657069]">
                {{
                  data.totalReviews
                    ? `Average across ${formatNumber(data.totalReviews)} published reviews, all time.`
                    : 'Your rating will appear after the first published review.'
                }}
              </p>
            </section>
            <section class="rounded-2xl bg-[#edf4e6] p-6 text-sm leading-6 text-[#526659]">
              <div class="flex items-center gap-2 font-semibold text-[#315b3a]">
                <UIcon name="i-lucide-info" />About these numbers
              </div>
              <p class="mt-3">
                Views and clicks begin when insights tracking is enabled. Earlier visits aren’t
                included.
              </p>
              <p class="mt-3">
                Repeat activity within a 30-minute window is grouped. Your signed-in visits, known
                bots and privacy opt-outs are excluded. Counts can be lower than actual activity and
                don’t represent unique visitors or sales.
              </p>
            </section>
          </div>
        </div>
      </template>
    </main>
  </WorkspaceShell>
</template>
